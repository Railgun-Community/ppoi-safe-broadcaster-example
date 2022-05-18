import { BigNumber } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { NetworkChainID } from '../config/config-chain-ids';
import configDefaults from '../config/config-defaults';
import { resetMapObject } from '../../util/utils';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import { getGasTokenBalance } from './gas-token-balance';
import { ActiveWallet } from '../../models/wallet-models';

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
): Promise<void> => {
  if (!gasTokenBalanceCache[chainID]) {
    gasTokenBalanceCache[chainID] = {};
  }
  const balance = await getGasTokenBalance(chainID, walletAddress);
  if (balance == null) {
    return;
  }
  gasTokenBalanceCache[chainID][walletAddress] = {
    balance,
    updatedAt: Date.now(),
  };
};

export const updateAllActiveWalletsGasTokenBalances = async (
  activeWallets: ActiveWallet[],
) => {
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
  activeWallets: ActiveWallet[],
): Promise<MapType<BigNumber>> => {
  const getBalancePromises: Promise<BigNumber>[] = [];
  activeWallets.forEach(({ address }) => {
    getBalancePromises.push(getCachedGasTokenBalance(chainID, address));
  });
  const balances = await Promise.all(getBalancePromises);

  const balanceMap: MapType<BigNumber> = {};
  activeWallets.forEach((activeWallet, index) => {
    balanceMap[activeWallet.address] = balances[index];
  });

  return balanceMap;
};

export const convertToReadableGasTokenBalanceMap = (
  gasTokenBalanceMap: MapType<BigNumber>,
) => {
  const addresses = Object.keys(gasTokenBalanceMap);
  const readableMap: MapType<string> = {};
  const decimals = 18;
  addresses.forEach((address) => {
    readableMap[address] = formatUnits(gasTokenBalanceMap[address], decimals);
  });
  return readableMap;
};
