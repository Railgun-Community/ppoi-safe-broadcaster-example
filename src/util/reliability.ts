// reliability functionality

import debug from 'debug';
import type { BroadcasterChain } from '../models/chain-models';
import {
  getSettingsNumber,
  storeSettingsNumber,
} from '../server/db/settings-db';
import { isDefined } from '@railgun-community/shared-models';

const dbg = debug('broadcaster:utils:reliability');

const BROADCASTER_KEY = 'reliability_key';

const MetricsStrings = [
  'total_seen', // total number of messages seen
  'decode_success',
  'decode_failure', // this one will be seen_total - decode_success
  'send_success',
  'send_failure',
];

export const ReliabilityMetric = {
  TOTAL_SEEN: 'total_seen',
  DECODE_SUCCESS: 'decode_success',
  DECODE_FAILURE: 'decode_failure',
  SEND_SUCCESS: 'send_success',
  SEND_FAILURE: 'send_failure',
};

export const getReliabilityKeyPath = (
  chain: BroadcasterChain,
  metric: string,
) => {
  return `${BROADCASTER_KEY}|${metric}|${chain.type}|${chain.id}`;
};

export const incrementReliability = async (
  chain: BroadcasterChain,
  metric: string,
) => {
  const key = getReliabilityKeyPath(chain, metric);
  const current = await getReliability(key);
  if (isDefined(current)) {
    const next = current + 1;
    await setReliability(key, next);
  } else {
    await setReliability(key, 1);
  }
};

export const decrementReliability = async (
  chain: BroadcasterChain,
  metric: string,
) => {
  const key = getReliabilityKeyPath(chain, metric);
  const current = await getReliability(key);
  if (isDefined(current)) {
    const next = current - 1;
    await setReliability(key, next);
  } else {
    await setReliability(key, 0);
  }
};

export const getReliability = async (
  key: string,
): Promise<Optional<number>> => {
  return await getSettingsNumber(key).catch((e) => {
    dbg(`Error getting reliability metric, ${key}: ${e}`);
    return undefined;
  });
};

export const setReliability = async (
  key: string,
  value: number,
): Promise<void> => {
  return await storeSettingsNumber(key, value).catch((e) => {
    dbg(`Error setting reliability metric, ${key}: ${value}: ${e}`);
  });
};

// calculate ratios

export const getReliabilityRatio = async (
  chain: BroadcasterChain,
): Promise<number> => {
  const successKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.SEND_SUCCESS,
  );
  const failureKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.SEND_FAILURE,
  );
  const success = await getReliability(successKey);
  const failure = await getReliability(failureKey);
  if (isDefined(success) && isDefined(failure)) {
    return success / (success + failure);
  }
  // return 1 for 'initial' report value;
  // waku-broadcaster-client will sort based on reliability
  return 1;
};

export const initReliabilityMetricsForChain = async (
  chain: BroadcasterChain,
): Promise<void> => {
  for (const metric of MetricsStrings) {
    const key = getReliabilityKeyPath(chain, metric);
    // eslint-disable-next-line no-await-in-loop
    const current = await getReliability(key);
    if (!isDefined(current)) {
      // eslint-disable-next-line no-await-in-loop
      await setReliability(key, 0);
    }
  }
};
