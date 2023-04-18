import { parseUnits } from '@ethersproject/units';
import { RelayerChain } from '../../models/chain-models';
import { ActiveWallet } from '../../models/wallet-models';
import { logger } from '../../util/logger';
import { resetMapObject } from '../../util/utils';
import { getCachedGasTokenBalance } from '../balances/balance-cache';
import configNetworks from '../config/config-networks';
import debug from 'debug';
import { BigNumber } from '@ethersproject/bignumber';

const unavailableWalletMap: NumMapType<NumMapType<MapType<boolean>>> = {};

const dbg = debug('relayer:wallets:availability');

const lastUsedWalletAddressMap: NumMapType<NumMapType<string>> = {};

export const getLastUsedWalletAddressForChain = (chain: RelayerChain) => {
  return lastUsedWalletAddressMap?.[chain.type]?.[chain.id] ?? '';
};

export const setLastWalletUsed = (
  walletAddress: string,
  chain: RelayerChain,
) => {
  lastUsedWalletAddressMap[chain.type] ??= {};
  lastUsedWalletAddressMap[chain.type][chain.id] = walletAddress;
};

export const setWalletAvailability = (
  wallet: ActiveWallet,
  chain: RelayerChain,
  available: boolean,
) => {
  unavailableWalletMap[chain.type] ??= {};
  unavailableWalletMap[chain.type][chain.id] ??= {};
  unavailableWalletMap[chain.type][chain.id][wallet.address] = !available;
  dbg(`Set wallet ${wallet.address}:`, available ? 'AVAILABLE' : 'BUSY');
  if (!available) {
    setLastWalletUsed(wallet.address, chain);
  }
};

export const isWalletAvailableWithEnoughFunds = async (
  wallet: ActiveWallet,
  chain: RelayerChain,
) => {
  if (isWalletUnavailable(wallet, chain)) {
    return false;
  }
  try {
    return !(await isBelowMinimumGasTokenBalance(wallet, chain));
  } catch (err) {
    logger.error(err);
    logger.warn(
      `Error getting gas token balance for wallet ${wallet.address}. Assuming wallet unavailable.`,
    );
    return false;
  }
};

export const minimumGasBalanceForAvailability = (
  chain: RelayerChain,
): BigNumber => {
  const { gasToken } = configNetworks[chain.type][chain.id];
  return parseUnits(
    String(gasToken.minBalanceForAvailability),
    gasToken.decimals,
  );
};

export const isBelowMinimumGasTokenBalance = async (
  wallet: ActiveWallet,
  chain: RelayerChain,
) => {
  try {
    const balance = await getCachedGasTokenBalance(chain, wallet.address);
    const minBalance = minimumGasBalanceForAvailability(chain);
    if (balance.lt(minBalance)) {
      return true;
    }
    return false;
  } catch (err) {
    logger.error(err);
    logger.warn(
      `Error getting gas token balance for wallet ${wallet.address}. Assuming wallet has enough funds.`,
    );
    return false;
  }
};

export const isWalletUnavailable = (
  wallet: ActiveWallet,
  chain: RelayerChain,
) => {
  unavailableWalletMap[chain.type] ??= {};
  unavailableWalletMap[chain.type][chain.id] ??= {};
  if (unavailableWalletMap[chain.type][chain.id][wallet.address]) {
    return true;
  }
  return false;
};

export const shouldTopUpWallet = async (
  wallet: ActiveWallet,
  chain: RelayerChain,
) => {
  return (
    !isWalletUnavailable(wallet, chain) &&
    (await isBelowMinimumGasTokenBalance(wallet, chain))
  );
};

export const getAvailableWallets = async (
  activeWallets: ActiveWallet[],
  chain: RelayerChain,
) => {
  const walletAvailability = await Promise.all(
    activeWallets.map((wallet) =>
      isWalletAvailableWithEnoughFunds(wallet, chain),
    ),
  );
  return activeWallets.filter((_wallet, index) => walletAvailability[index]);
};

export const resetAvailableWallets = (chain: RelayerChain) => {
  unavailableWalletMap[chain.type] ??= {};
  resetMapObject(unavailableWalletMap[chain.type][chain.id]);
};
