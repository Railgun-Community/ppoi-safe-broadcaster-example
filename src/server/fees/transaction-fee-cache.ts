import { BigNumber } from 'ethers';
import configDefaults from '../config/config-defaults';
import { logger } from '../../util/logger';
import { resetMapObject } from '../../util/utils';

type CachedFee = {
  maximumGasFeeString: string;
  updatedAt: number; // In milliseconds.
};

// Cached token prices per network.
// {cacheKey: CachedFee}
const transactionFeeCache: MapType<CachedFee> = {};

const cacheKey = (
  serializedTransaction: string,
  tokenAddress: string,
): string => {
  return `${serializedTransaction}|${tokenAddress}`;
};

export const resetTransactionFeeCache = () => {
  resetMapObject(transactionFeeCache);
};

export const cacheFeeForTransaction = (
  serializedTransaction: string,
  tokenAddress: string,
  maximumGasFee: BigNumber,
) => {
  logger.log(`cache new fee for tx: ${maximumGasFee}`);
  const key = cacheKey(serializedTransaction, tokenAddress);
  const cachedFee: CachedFee = {
    maximumGasFeeString: maximumGasFee.toString(),
    updatedAt: Date.now(),
  };
  transactionFeeCache[key] = cachedFee;
};

export const lookUpCachedFee = (
  serializedTransaction: string,
  tokenAddress: string,
): Optional<CachedFee> => {
  const key = cacheKey(serializedTransaction, tokenAddress);
  const cachedFee = transactionFeeCache[key];
  if (!cachedFee) {
    return undefined;
  }

  const ttl = configDefaults.transactionFees.cacheTTLInMS;
  const feeExpired = cachedFee.updatedAt + ttl < Date.now();
  if (feeExpired) {
    return undefined;
  }

  return cachedFee;
};
