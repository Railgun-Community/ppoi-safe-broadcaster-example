// reliability functionality

import debug from 'debug';
import type { BroadcasterChain } from '../models/chain-models';
import {
  getSettingsNumber,
  storeSettingsNumber,
} from '../server/db/settings-db';
import { isDefined } from '@railgun-community/shared-models';

// store successful decode count
// store successful 'send' count
// store failed 'send' count

const dbg = debug('broadcaster:utils:reliablity');

const BROADCASTER_KEY = 'reliability_key';

const MetricsStrings = ['decode_success', 'send_success', 'send_failure'];

export const ReliabilityMetric = {
  DECODE_SUCCESS: 'decode_success',
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
  console.log('Incrementing reliability');
};

export const decrementReliability = async (
  chain: BroadcasterChain,
  metric: string,
) => {
  const key = getReliabilityKeyPath(chain, metric);
  console.log('Decrementing reliability', key);
  const current = await getReliability(key);
  if (isDefined(current)) {
    const next = current - 1;
    await setReliability(key, next);
  } else {
    await setReliability(key, 0);
  }
  console.log('Decrementing reliability');
};

export const getReliability = async (
  key: string,
): Promise<Optional<number>> => {
  return await getSettingsNumber(key);
};

export const setReliability = async (
  key: string,
  value: number,
): Promise<void> => {
  return await storeSettingsNumber(key, value);
};

// calculate ratios

export const getReliabilityRatio = async (
  chain: BroadcasterChain,
  metric: string,
): Promise<number> => {
  const successKey = getReliabilityKeyPath(chain, metric);
  const failureKey = getReliabilityKeyPath(chain, metric);
  const success = await getReliability(successKey);
  const failure = await getReliability(failureKey);
  if (isDefined(success) && isDefined(failure)) {
    return success / (success + failure);
  }
  return 0;
};

export const getReliabilityRatios = async (
  chain: BroadcasterChain,
): Promise<Record<string, number>> => {
  const ratios: Record<string, number> = {
    DECODE_SUCCESS: 0,
    SEND_SUCCESS: 0,
    SEND_FAILURE: 0,
  };
  for (const metric of Object.keys(MetricsStrings)) {
    // eslint-disable-next-line no-await-in-loop
    ratios[metric] = await getReliabilityRatio(
      chain,
      // @ts-ignore
      metric,
    );
  }
  return ratios;
};
