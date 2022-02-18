import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import configDefaults from '../config/config-defaults';
import { resetMapObject } from '../../util/utils';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import { getActiveWallets } from '../wallets/active-wallets';
import { getGasTokenBalance } from './gas-token-balance';

type CachedBalance = {
  balance: BigNumber;
  updatedAt: number;
};

// {ChainID: {Address: Balance}}
const gasTokenBalanceCache: NumMapType<MapType<CachedBalance>> = {};

export const resetGasTokenBalanceCache = () => {
  resetMapObject(gasTokenBalanceCache);
};

export const updateCachedGasTokenBalance = async (
  chainID: NetworkChainID,
  walletAddress: string,
) => {
  const balance = await getGasTokenBalance(chainID, walletAddress);
  if (!gasTokenBalanceCache[chainID]) {
    gasTokenBalanceCache[chainID] = {};
  }
  gasTokenBalanceCache[chainID][walletAddress] = {
    balance,
    updatedAt: Date.now(),
  };
};

export const updateAllActiveWalletsGasTokenBalances = async () => {
  const activeWallets = getActiveWallets();
  const balanceUpdatePromises: Promise<void>[] = [];

  configuredNetworkChainIDs().forEach((chainID) => {
    activeWallets.forEach(({ address }) => {
      balanceUpdatePromises.push(updateCachedGasTokenBalance(chainID, address));
    });
  });

  await Promise.all(balanceUpdatePromises);
};

export const shouldUpdateCachedGasTokenBalance = (
  chainID: NetworkChainID,
  walletAddress: string,
) => {
  if (
    !gasTokenBalanceCache[chainID] ||
    !gasTokenBalanceCache[chainID][walletAddress]
  ) {
    return true;
  }
  const cachedBalance = gasTokenBalanceCache[chainID][walletAddress];
  const cachedBalanceExpired =
    cachedBalance.updatedAt <
    Date.now() - configDefaults.balances.gasTokenBalanceCacheTTLInMS;
  return cachedBalanceExpired;
};

export const getCachedGasTokenBalance = async (
  chainID: NetworkChainID,
  walletAddress: string,
): Promise<BigNumber> => {
  if (shouldUpdateCachedGasTokenBalance(chainID, walletAddress)) {
    await updateCachedGasTokenBalance(chainID, walletAddress);
  }
  return gasTokenBalanceCache[chainID][walletAddress].balance;
};

export const getActiveWalletGasTokenBalanceMapForChain = async (
  chainID: NetworkChainID,
): Promise<MapType<BigNumber>> => {
  const activeWallets = getActiveWallets();

  const getBalancePromises: Promise<BigNumber>[] = [];
  activeWallets.forEach(({ address }) => {
    getBalancePromises.push(getCachedGasTokenBalance(chainID, address));
  });
  const balances = await Promise.all(getBalancePromises);

  const balanceMap: MapType<BigNumber> = {};
  activeWallets.forEach(({ address }, index) => {
    balanceMap[address] = balances[index];
  });

  return balanceMap;
};
