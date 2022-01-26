import configDefaults from '../../config/config-defaults';
import { logger } from '../../util/logger';

type CachedFee = {
  feeDecimal: number;
  updatedAt: number; // In milliseconds.
};

// Cached token prices per network.
// {cacheKey: {address, }}
const transactionFeeCache: MapType<CachedFee> = {};

const cacheKey = (
  serializedTransaction: string,
  tokenAddress: string,
): string => {
  return `${serializedTransaction}|${tokenAddress}`;
};

export const cacheFeeForTransaction = (
  serializedTransaction: string,
  tokenAddress: string,
  feeDecimal: number,
) => {
  logger.debugLog(`cache new fee for tx: ${feeDecimal}`);
  const key = cacheKey(serializedTransaction, tokenAddress);
  const cachedFee: CachedFee = {
    feeDecimal,
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

  const ttl = configDefaults.transactionFeeCacheTTLInMS;
  const feeExpired = cachedFee.updatedAt + ttl < Date.now();
  if (feeExpired) {
    return undefined;
  }

  return cachedFee;
};
