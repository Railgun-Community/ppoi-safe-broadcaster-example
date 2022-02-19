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
  const id = generateFeeCacheID();
  const cachedFee: CachedFees = {
    tokenFees,
    updatedAt: Date.now(),
  };
  if (!transactionFeeCache[chainID]) {
    transactionFeeCache[chainID] = {};
  }
  transactionFeeCache[chainID][id] = cachedFee;
  clearExpiredFees(chainID);
  return id;
};

const cachedFeesExpired = (cachedFees: CachedFees) => {
  const ttl = configDefaults.transactionFees.feeExpirationInMS;
  return cachedFees.updatedAt + ttl < Date.now();
};

export const lookUpCachedUnitTokenFee = (
  chainID: NetworkChainID,
  id: string,
  tokenAddress: string,
): Optional<BigNumber> => {
  if (!transactionFeeCache[chainID]) {
    transactionFeeCache[chainID] = {};
  }
  const cachedFees = transactionFeeCache[chainID][id];
  if (!cachedFees) {
    return undefined;
  }
  if (cachedFeesExpired(cachedFees)) {
    return undefined;
  }
  return cachedFees.tokenFees[tokenAddress];
};
