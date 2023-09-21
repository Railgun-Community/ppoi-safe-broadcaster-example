import { RelayerChain } from '../../models/chain-models';
import { ContractTransaction } from 'ethers';

const cachedGasPrice: NumMapType<NumMapType<MapType<CachedGasPrice>>> = {};
const initGasPriceCache = (chain: RelayerChain) => {
  cachedGasPrice[chain.type] ??= {};
  cachedGasPrice[chain.type][chain.id] ??= {};
};
export const getCachedGasPrice = (
  chain: RelayerChain,
  walletAddress: string,
) => {
  initGasPriceCache(chain);
  if (
    typeof cachedGasPrice[chain.type][chain.id][walletAddress] !== 'undefined'
  ) {
    // return the public cache
    return cachedGasPrice[chain.type][chain.id][walletAddress];
  }
  return undefined;
};
type CachedGasPrice = {
  gasPrice: bigint;
  cacheTime: number;
};
export const cacheGasPrice = (
  chain: RelayerChain,
  walletAddress: string,
  gasPrice: bigint,
) => {
  initGasPriceCache(chain);
  const newCache = {
    gasPrice,
    cacheTime: Date.now(),
  };
  cachedGasPrice[chain.type][chain.id][walletAddress] = newCache;
};
export const clearCachedGasPrice = (
  chain: RelayerChain,
  walletAddress: string,
) => {
  initGasPriceCache(chain);
  if (
    typeof cachedGasPrice[chain.type][chain.id][walletAddress] !== 'undefined'
  ) {
    delete cachedGasPrice[chain.type][chain.id][walletAddress];
  }
};

type SubmittedTxCache = {
  hash: string;
  timestamp: number;
  completed: boolean;
};
const cachedSubmittedTxs: NumMapType<NumMapType<SubmittedTxCache[]>> = {};
const initSubmittedTxCache = (chain: RelayerChain) => {
  cachedSubmittedTxs[chain.type] ??= {};
  cachedSubmittedTxs[chain.type][chain.id] ??= [];
};

export const cacheSubmittedTx = (chain: RelayerChain, hash: string) => {
  initSubmittedTxCache(chain);
  cachedSubmittedTxs[chain.type][chain.id].push({
    hash,
    timestamp: Date.now(),
    completed: false,
  });
};

export const txWasAlreadySent = (chain: RelayerChain, hash: string) => {
  initSubmittedTxCache(chain);
  for (const tx of cachedSubmittedTxs[chain.type][chain.id]) {
    if (tx.hash === hash) {
      return true;
    }
  }
  return false;
};

export const removeSubmittedTx = (chain: RelayerChain, hash: string) => {
  initSubmittedTxCache(chain);
  const newArray: SubmittedTxCache[] = cachedSubmittedTxs[chain.type][
    chain.id
  ].filter((tx) => {
    return tx.hash !== hash;
  });
  cachedSubmittedTxs[chain.type][chain.id] = newArray;
};

export const cleanupSubmittedTxs = (chain: RelayerChain) => {
  initSubmittedTxCache(chain);
  const newArray: SubmittedTxCache[] = cachedSubmittedTxs[chain.type][
    chain.id
  ].filter((tx) => {
    const timeDifference = Date.now() - tx.timestamp;
    const timeThreshold = 10 * 60 * 1000;
    return timeDifference < timeThreshold;
  });
  cachedSubmittedTxs[chain.type][chain.id] = newArray;
};

/**
 * top up cache stuff
 */
export type TopUpTransaction = {
  tx: ContractTransaction;
  timestamp: number;
  attempts: number;
};

const topUpTransactionCache: NumMapType<NumMapType<TopUpTransaction>> = {};

const initTopUpCache = (chain: RelayerChain) => {
  topUpTransactionCache[chain.type] ??= {};
  // topUpTransactionCache[chain.type][chain.id] ??= {};
};

export const getCachedTransaction = (chain: RelayerChain) => {
  initTopUpCache(chain);
  if (typeof topUpTransactionCache[chain.type][chain.id] !== 'undefined') {
    topUpTransactionCache[chain.type][chain.id].attempts += 1;
    return topUpTransactionCache[chain.type][chain.id];
  }
  return undefined;
};
/**
 * This should only get called once, the first time we successfully
 * generate the populatedTx, and again when its cleared after timeout refresh of it.
 */
export const cacheTopUpTransaction = (
  chain: RelayerChain,
  populatedTransaction: ContractTransaction,
) => {
  initTopUpCache(chain);
  // force clear the old transaction.
  topUpTransactionCache[chain.type][chain.id] = {
    tx: populatedTransaction,
    timestamp: Date.now(),
    attempts: 0,
  };
};

export const clearCachedTransaction = (chain: RelayerChain) => {
  initTopUpCache(chain);
  if (typeof topUpTransactionCache[chain.type][chain.id] !== 'undefined') {
    delete topUpTransactionCache[chain.type][chain.id];
  }
};
