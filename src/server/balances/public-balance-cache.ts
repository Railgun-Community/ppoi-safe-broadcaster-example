import debug from 'debug';
import { BroadcasterChain } from '../../models/chain-models';

const dbg = debug('broadcaster:public-balance-cache');
type PublicBalanceCache = {
  timestamp: number;
  balance: bigint;
};
const cachedPublicTokenBalances: NumMapType<
  NumMapType<MapType<MapType<PublicBalanceCache>>>
> = {};
const initPublicCache = (chain: BroadcasterChain, walletAddress: string) => {
  cachedPublicTokenBalances[chain.type] ??= {};
  cachedPublicTokenBalances[chain.type][chain.id] ??= {};
  cachedPublicTokenBalances[chain.type][chain.id][walletAddress] ??= {};
};

export const getCachedPublicBalance = (
  chain: BroadcasterChain,
  walletAddress: string,
  tokenAddress: string,
) => {
  initPublicCache(chain, walletAddress);
  if (
    typeof cachedPublicTokenBalances[chain.type][chain.id][walletAddress][
      tokenAddress
    ] !== 'undefined'
  ) {
    const timeThreshold = 1 * 60 * 60 * 1000;
    const timeDifference =
      Date.now() -
      cachedPublicTokenBalances[chain.type][chain.id][walletAddress][
        tokenAddress
      ].timestamp;

    if (timeDifference > timeThreshold) {
      dbg(
        `[${chain.type}:${chain.id}] OUTDATED PUBLIC BALANCE: (${timeDifference}ms) Token: ${tokenAddress} Wallet: ${walletAddress}`,
      );
    }

    return cachedPublicTokenBalances[chain.type][chain.id][walletAddress][
      tokenAddress
    ].balance;
  }
  // dbg(
  //   `[${chain.type}:${chain.id}] NO PUBLIC BALANCE: Token: ${tokenAddress} Wallet: ${walletAddress}`,
  // );

  return undefined;
};

export const cachePublicBalance = (
  chain: BroadcasterChain,
  walletAddress: string,
  tokenAddress: string,
  balance: bigint,
) => {
  initPublicCache(chain, walletAddress);
  cachedPublicTokenBalances[chain.type][chain.id][walletAddress][tokenAddress] =
    {
      timestamp: Date.now(),
      balance,
    };
};

export const clearCachedBalances = (
  chain: BroadcasterChain,
  walletAddress: string,
) => {
  initPublicCache(chain, walletAddress);
  dbg('clearing public balances for ', walletAddress);
  if (
    typeof cachedPublicTokenBalances[chain.type][chain.id][walletAddress] !==
    'undefined'
  ) {
    delete cachedPublicTokenBalances[chain.type][chain.id][walletAddress];
  }
};
