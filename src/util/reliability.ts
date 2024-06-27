import debug from 'debug';
import type { BroadcasterChain } from '../models/chain-models';
import {
  getSettingsNumberNoError,
  storeSettingsNumber,
} from '../server/db/settings-db';
import { isDefined } from '@railgun-community/shared-models';

const dbg = debug('broadcaster:utils:reliability');

const BROADCASTER_KEY = 'reliability_key';

const MetricsStrings = [
  'total_seen',
  'decode_success',
  'decode_failure',
  'send_success',
  'send_failure',
  'bad_data',
  'gas_estimate_success',
  'gas_estimate_failure',
  'fee_validation_success',
  'fee_validation_failure',
  'poi_validation_success',
  'poi_validation_failure',
];

export const ReliabilityMetric = {
  TOTAL_SEEN: 'total_seen',
  DECODE_SUCCESS: 'decode_success',
  DECODE_FAILURE: 'decode_failure',
  SEND_SUCCESS: 'send_success',
  SEND_FAILURE: 'send_failure',
  BAD_DATA: 'bad_data',
  GAS_ESTIMATE_SUCCESS: 'gas_estimate_success',
  GAS_ESTIMATE_FAILURE: 'gas_estimate_failure',
  FEE_VALIDATION_SUCCESS: 'fee_validation_success',
  FEE_VALIDATION_FAILURE: 'fee_validation_failure',
  POI_VALIDATION_SUCCESS: 'poi_validation_success',
  POI_VALIDATION_FAILURE: 'poi_validation_failure',
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
  return await getSettingsNumberNoError(key);
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
  const {
    totalSeenCount,
    txSuccessCount,
    txFailureCount,
    poiValidationSuccessCount,
    poiValidationFailureCount,
    feeValidationSuccessCount,
    feeValidationFailureCount,
    gasEstimateSuccessCount,
    gasEstimateFailureCount,
    decodeSuccessCount,
    decodeFailureCount,
  } = await getAllMetricsForChain(chain);

  const baselineSeenCount = totalSeenCount - decodeFailureCount;

  const baselineSeenRatio =
    (decodeSuccessCount + decodeFailureCount) / totalSeenCount;
  // poi ratios
  let poiValidationRatio = 0;
  if (
    isDefined(poiValidationSuccessCount) &&
    isDefined(poiValidationFailureCount)
  ) {
    poiValidationRatio =
      poiValidationSuccessCount /
      (poiValidationSuccessCount + poiValidationFailureCount);
  }

  // fee ratios
  // best ratio should match the success & total seen
  let feeValidationRatio = 0;
  if (
    isDefined(feeValidationSuccessCount) &&
    isDefined(feeValidationFailureCount)
  ) {
    feeValidationRatio =
      feeValidationSuccessCount /
      (feeValidationSuccessCount + feeValidationFailureCount);
  }

  // gas estimate ratios
  // - success should also reflect as the same number of 'success' also 'total seen'
  let gasEstimateRatio = 0;
  if (
    isDefined(gasEstimateSuccessCount) &&
    isDefined(gasEstimateFailureCount)
  ) {
    gasEstimateRatio =
      gasEstimateSuccessCount /
      (gasEstimateSuccessCount + gasEstimateFailureCount);
  }

  // decode ratios
  let decodeRatio = 0;
  if (isDefined(decodeSuccessCount) && isDefined(decodeFailureCount)) {
    decodeRatio = decodeSuccessCount / baselineSeenCount;
  }

  const baseReliability =
    poiValidationRatio + //
    feeValidationRatio +
    gasEstimateRatio +
    decodeRatio;

  const basicReliability = baseReliability / 4;
  const reliability = basicReliability * baselineSeenRatio;

  if (!Number.isNaN(reliability) && Number.isFinite(reliability)) {
    return parseFloat(reliability.toFixed(2));
  }

  if (
    isDefined(txSuccessCount) &&
    txSuccessCount > 0 &&
    isDefined(txFailureCount)
  ) {
    return parseFloat(
      (txSuccessCount / (txSuccessCount + txFailureCount)).toFixed(2),
    );
  }
  if (isDefined(txSuccessCount) && txSuccessCount > 0) {
    return 1;
  }
  return -1;
};

export const initReliabilityMetricsForChain = async (
  chain: BroadcasterChain,
): Promise<void> => {
  const initKeyPath = getReliabilityKeyPath(chain, 'chain_initialized');
  const initialized = await getReliability(initKeyPath);

  if (isDefined(initialized)) {
    dbg(`Reliablitly Metrics initialized on chain ${chain.type}:${chain.id}`);
    return;
  }
  for (const metric of MetricsStrings) {
    const key = getReliabilityKeyPath(chain, metric);
    // eslint-disable-next-line no-await-in-loop
    await setReliability(key, 0);
  }
  await setReliability(initKeyPath, 1337);
};

export const getAllMetricsForChain = async (
  chain: BroadcasterChain,
): Promise<any> => {
  const totalSeenKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.TOTAL_SEEN,
  );

  const decodeSuccessKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.DECODE_SUCCESS,
  );
  const decodeFailureKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.DECODE_FAILURE,
  );
  const gasEstimateSuccessKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.GAS_ESTIMATE_SUCCESS,
  );
  const gasEstimateFailureKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.GAS_ESTIMATE_FAILURE,
  );
  const feeValidationSuccessKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.FEE_VALIDATION_SUCCESS,
  );
  const feeValidationFailureKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.FEE_VALIDATION_FAILURE,
  );
  const poiValidationSuccessKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.POI_VALIDATION_SUCCESS,
  );
  const poiValidationFailureKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.POI_VALIDATION_FAILURE,
  );
  const txSendSuccessKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.SEND_SUCCESS,
  );
  const txSendFailureKey = getReliabilityKeyPath(
    chain,
    ReliabilityMetric.SEND_FAILURE,
  );
  const totalSeenCount = await getReliability(totalSeenKey);

  const txSuccessCount = await getReliability(txSendSuccessKey);
  const txFailureCount = await getReliability(txSendFailureKey);
  const poiValidationSuccessCount = await getReliability(
    poiValidationSuccessKey,
  );
  const poiValidationFailureCount = await getReliability(
    poiValidationFailureKey,
  );
  const feeValidationSuccessCount = await getReliability(
    feeValidationSuccessKey,
  );
  const feeValidationFailureCount = await getReliability(
    feeValidationFailureKey,
  );
  const gasEstimateSuccessCount = await getReliability(gasEstimateSuccessKey);
  const gasEstimateFailureCount = await getReliability(gasEstimateFailureKey);
  const decodeSuccessCount = await getReliability(decodeSuccessKey);
  const decodeFailureCount = await getReliability(decodeFailureKey);

  return {
    totalSeenCount,
    txSuccessCount,
    txFailureCount,
    poiValidationSuccessCount,
    poiValidationFailureCount,
    feeValidationSuccessCount,
    feeValidationFailureCount,
    gasEstimateSuccessCount,
    gasEstimateFailureCount,
    decodeSuccessCount,
    decodeFailureCount,
  };
};
