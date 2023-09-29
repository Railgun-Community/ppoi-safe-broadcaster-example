import { parseUnits } from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { ActiveWallet } from '../../models/wallet-models';
import { logger } from '../../util/logger';
import { resetMapObject } from '../../util/utils';
import { getCachedGasTokenBalance } from '../balances/balance-cache';
import configNetworks from '../config/config-networks';
import debug from 'debug';
import { hasPendingTransactions } from './pending-wallet';

const unavailableWalletMap: NumMapType<NumMapType<MapType<boolean>>> = {};

export const dbg = debug('relayer:wallets:availability');

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
  setWalleUsed = true,
) => {
  unavailableWalletMap[chain.type] ??= {};
  unavailableWalletMap[chain.type][chain.id] ??= {};
  unavailableWalletMap[chain.type][chain.id][wallet.address] = !available;
  dbg(`Set wallet ${wallet.address}:`, available ? 'AVAILABLE' : 'BUSY');
  if (!available && setWalleUsed) {
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
): bigint => {
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
    if (balance < minBalance) {
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
  const availableWallets: boolean[] = [];

  for (const wallet of activeWallets) {
    // run pending check here to reduce calls on RPC
    const hasTransactions = hasPendingTransactions(wallet, chain);

    if (hasTransactions === false) {
      // eslint-disable-next-line no-await-in-loop
      const available = await isWalletAvailableWithEnoughFunds(wallet, chain);
      availableWallets.push(available);
    } else {
      dbg(`${wallet.address} has Pending Transactions. Skipping`);
      availableWallets.push(false); // filter below is expecting properindex.
    }
  }

  return activeWallets.filter((_wallet, index) => availableWallets[index]);
};

export const resetAvailableWallets = (chain: RelayerChain) => {
  unavailableWalletMap[chain.type] ??= {};
  resetMapObject(unavailableWalletMap[chain.type][chain.id]);
};



