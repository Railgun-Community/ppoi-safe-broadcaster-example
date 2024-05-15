import configDefaults from '../config/config-defaults';
import { removeUndefineds, resetMapObject } from '../../util/utils';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { getGasTokenBalance } from './gas-token-balance';
import { ActiveWallet } from '../../models/wallet-models';
import { logger } from '../../util/logger';
import { BroadcasterChain } from '../../models/chain-models';
import { formatUnits } from 'ethers';
import { delay, isDefined } from '@railgun-community/shared-models';

type CachedBalance = {
  balance: bigint;
  updatedAt: number;
};

// {chainType: {chainID: {Address: Balance}}}
const gasTokenBalanceCache: NumMapType<NumMapType<MapType<CachedBalance>>> = {};

export const resetGasTokenBalanceCache = () => {
  resetMapObject(gasTokenBalanceCache);
};

export const updateCachedGasTokenBalance = async (
  chain: BroadcasterChain,
  walletAddress: string,
  retryCount = 0,
): Promise<void> => {
  const balance = await getGasTokenBalance(chain, walletAddress);
  if (!isDefined(balance)) {
    if (retryCount < 3) {
      await delay(1000);
      return updateCachedGasTokenBalance(chain, walletAddress, retryCount + 1);
    }
    return;
  }
  gasTokenBalanceCache[chain.type] ??= {};
  gasTokenBalanceCache[chain.type][chain.id] ??= {};
  gasTokenBalanceCache[chain.type][chain.id][walletAddress] = {
    balance,
    updatedAt: Date.now(),
  };
};

// only used for tests?
export const updateAllActiveWalletsGasTokenBalances = async (
  activeWallets: ActiveWallet[],
) => {
  const balanceUpdatePromises: Promise<void>[] = [];

  const currentChains = configuredNetworkChains();
  for (const chainID of currentChains) {
    for (const { address } of activeWallets) {
      balanceUpdatePromises.push(updateCachedGasTokenBalance(chainID, address));
      // eslint-disable-next-line no-await-in-loop
      await delay(1000);
    }
  }
  // configuredNetworkChains().forEach((chainID) => {
  //   activeWallets.forEach(({ address }) => {
  //     balanceUpdatePromises.push(updateCachedGasTokenBalance(chainID, address));
  //   });
  // });

  await Promise.allSettled(balanceUpdatePromises);
};

export const shouldUpdateCachedGasTokenBalance = (
  chain: BroadcasterChain,
  walletAddress: string,
) => {
  gasTokenBalanceCache[chain.type] ??= {};
  gasTokenBalanceCache[chain.type][chain.id] ??= {};
  if (!isDefined(gasTokenBalanceCache[chain.type][chain.id][walletAddress])) {
    return true;
  }
  const cachedBalance =
    gasTokenBalanceCache[chain.type][chain.id][walletAddress];
  const cachedBalanceExpired =
    cachedBalance.updatedAt <
    Date.now() - configDefaults.balances.gasTokenBalanceCacheTTLInMS;
  return cachedBalanceExpired;
};

export const getCachedGasTokenBalance = async (
  chain: BroadcasterChain,
  walletAddress: string,
): Promise<bigint> => {
  if (shouldUpdateCachedGasTokenBalance(chain, walletAddress)) {
    // first call needs to 'await' it.
    if (!isDefined(gasTokenBalanceCache[chain.type][chain.id][walletAddress])) {
      await updateCachedGasTokenBalance(chain, walletAddress);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateCachedGasTokenBalance(chain, walletAddress); // dont wait for this promise, lazyLoad it instead.
    }
  }
  gasTokenBalanceCache[chain.type] ??= {};
  gasTokenBalanceCache[chain.type][chain.id] ??= {};
  if (!isDefined(gasTokenBalanceCache[chain.type][chain.id][walletAddress])) {
    return 0n; // return 0n instead
  }
  return gasTokenBalanceCache[chain.type][chain.id][walletAddress].balance;
};

export const getActiveWalletGasTokenBalanceMapForChain = async (
  chain: BroadcasterChain,
  activeWallets: ActiveWallet[],
): Promise<MapType<bigint>> => {
  const balancePromises: (bigint | undefined)[] = [];
  for (const { address } of activeWallets) {
    // eslint-disable-next-line no-await-in-loop
    const cachedGasBalance = await getCachedGasTokenBalance(
      chain,
      address,
    ).catch((err) => {
      logger.error(err);
      return undefined;
    });
    balancePromises.push(cachedGasBalance);
    // eslint-disable-next-line no-await-in-loop
    await delay(250);
  }

  const balanceResults = removeUndefineds(balancePromises);

  const balanceMap: MapType<bigint> = {};
  activeWallets.forEach(async (activeWallet, index) => {
    const balance = balanceResults[index];
    if (isDefined(balance)) {
      balanceMap[activeWallet.address] = balance;
    }
  });

  return balanceMap;
};

export const convertToReadableGasTokenBalanceMap = (
  gasTokenBalanceMap: MapType<bigint>,
) => {
  const addresses = Object.keys(gasTokenBalanceMap);
  const readableMap: MapType<string> = {};
  const decimals = 18;
  addresses.forEach((address) => {
    readableMap[address] = formatUnits(gasTokenBalanceMap[address], decimals);
  });
  return readableMap;
};
