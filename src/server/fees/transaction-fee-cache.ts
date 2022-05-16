import { BigNumber } from 'ethers';
import configDefaults from '../config/config-defaults';
import { resetMapObject } from '../../util/utils';
import { NetworkChainID } from '../config/config-chain-ids';

type CachedFees = {
  tokenFees: MapType<BigNumber>;
  updatedAt: number; // In milliseconds.
};

// Cached token prices per network.
// {chainID: {feeID: CachedFee}}
const transactionFeeCache: NumMapType<MapType<CachedFees>> = {};

export const resetTransactionFeeCache = () => {
  resetMapObject(transactionFeeCache);
};

const FEE_ID_CHARSET = 'abcdefghijklnopqrstuvwxyz0123456789';
const FEE_ID_CHARSET_LENGTH = FEE_ID_CHARSET.length;

const generateFeeCacheID = (length = 16) => {
  let retVal = '';
  for (let i = 0; i < length; i += 1) {
    retVal += FEE_ID_CHARSET.charAt(
      Math.floor(Math.random() * FEE_ID_CHARSET_LENGTH),
    );
  }
  return retVal;
};

const clearExpiredFees = (chainID: NetworkChainID) => {
  const cacheForChain = transactionFeeCache[chainID];
  const keys = Object.keys(cacheForChain);
  for (const key of keys) {
    const cachedFees = cacheForChain[key];
    if (cachedFeesExpired(cachedFees)) {
      delete cacheForChain[key];
    }
  }
};

export const cacheUnitFeesForTokens = (
  chainID: NetworkChainID,
  tokenFees: MapType<BigNumber>,
): string => {
  const feeCacheID = generateFeeCacheID();
  const cachedFee: CachedFees = {
    tokenFees,
    updatedAt: Date.now(),
  };
  if (!transactionFeeCache[chainID]) {
    transactionFeeCache[chainID] = {};
  }
  transactionFeeCache[chainID][feeCacheID] = cachedFee;
  clearExpiredFees(chainID);
  return feeCacheID;
};

const cachedFeesExpired = (cachedFees: CachedFees) => {
  const ttl = configDefaults.transactionFees.feeExpirationInMS;
  return cachedFees.updatedAt + ttl < Date.now();
};

export const lookUpCachedUnitTokenFee = (
  chainID: NetworkChainID,
  feeCacheID: string,
  tokenAddress: string,
): Optional<BigNumber> => {
  if (!transactionFeeCache[chainID]) {
    transactionFeeCache[chainID] = {};
  }
  const cachedFees = transactionFeeCache[chainID][feeCacheID];
  if (!cachedFees) {
    return undefined;
  }
  if (cachedFeesExpired(cachedFees)) {
    return undefined;
  }
  return cachedFees.tokenFees[tokenAddress];
};

/**
 * Checks if feeCacheID is in cache map. It's ok if it's expired.
 * The fee cache ID ensures that this exact server sent out the fees.
 * This enables a Relayer to run multiple servers with the same Rail Address (and different HD wallets).
 * We check whether the fee was dispatched by this Relayer in transact-method.ts.
 */
export const recognizesFeeCacheID = (
  chainID: NetworkChainID,
  feeCacheID: string,
) => {
  if (!transactionFeeCache[chainID]) {
    return false;
  }
  return transactionFeeCache[chainID][feeCacheID] != null;
};
