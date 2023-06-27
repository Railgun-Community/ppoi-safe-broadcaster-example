import configDefaults from '../config/config-defaults';
import { resetMapObject } from '../../util/utils';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { getGasTokenBalance } from './gas-token-balance';
import { ActiveWallet } from '../../models/wallet-models';
import { logger } from '../../util/logger';
import { RelayerChain } from '../../models/chain-models';
import { formatUnits } from 'ethers';
import { isDefined } from '@railgun-community/shared-models';

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
  chain: RelayerChain,
  walletAddress: string,
): Promise<void> => {
  const balance = await getGasTokenBalance(chain, walletAddress);
  if (balance == null) {
    return;
  }
  gasTokenBalanceCache[chain.type] ??= {};
  gasTokenBalanceCache[chain.type][chain.id] ??= {};
  gasTokenBalanceCache[chain.type][chain.id][walletAddress] = {
    balance,
    updatedAt: Date.now(),
  };
};

export const updateAllActiveWalletsGasTokenBalances = async (
  activeWallets: ActiveWallet[],
) => {
  const balanceUpdatePromises: Promise<void>[] = [];

  configuredNetworkChains().forEach((chainID) => {
    activeWallets.forEach(({ address }) => {
      balanceUpdatePromises.push(updateCachedGasTokenBalance(chainID, address));
    });
  });

  await Promise.all(balanceUpdatePromises);
};

export const shouldUpdateCachedGasTokenBalance = (
  chain: RelayerChain,
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
  chain: RelayerChain,
  walletAddress: string,
): Promise<bigint> => {
  if (shouldUpdateCachedGasTokenBalance(chain, walletAddress)) {
    await updateCachedGasTokenBalance(chain, walletAddress);
  }
  gasTokenBalanceCache[chain.type] ??= {};
  gasTokenBalanceCache[chain.type][chain.id] ??= {};
  if (!isDefined(gasTokenBalanceCache[chain.type][chain.id][walletAddress])) {
    throw new Error('No balance found');
  }
  return gasTokenBalanceCache[chain.type][chain.id][walletAddress].balance;
};

export const getActiveWalletGasTokenBalanceMapForChain = async (
  chain: RelayerChain,
  activeWallets: ActiveWallet[],
): Promise<MapType<bigint>> => {
  const getBalancePromises: Promise<Optional<bigint>>[] = [];
  activeWallets.forEach(({ address }) => {
    getBalancePromises.push(
      getCachedGasTokenBalance(chain, address).catch((err) => {
        logger.error(err);
        return undefined;
      }),
    );
  });
  const balances = await Promise.all(getBalancePromises);

  const balanceMap: MapType<bigint> = {};
  activeWallets.forEach((activeWallet, index) => {
    const balance = balances[index];
    if (balance != null) {
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
