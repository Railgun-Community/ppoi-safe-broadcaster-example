import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { getActiveWalletGasTokenBalanceMapForChain } from '../balances/balance-cache';
import { getActiveWallets } from './active-wallets';
import { isWalletAvailable } from './available-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import { logger } from '../../util/logger';

export const getBestMatchWalletForNetwork = async (
  chainID: NetworkChainID,
  maximumGas: BigNumber,
): Promise<ActiveWallet> => {
  const gasTokenBalanceMap = await getActiveWalletGasTokenBalanceMapForChain(
    chainID,
  );

  const activeWallets = getActiveWallets();

  // Simple filters:
  // - Availability.
  // - Amount of (gas token) available.
  // Simple sort:
  // - Priority.
  const sortedAvailableWallets = activeWallets
    .filter((wallet) => isWalletAvailable(wallet))
    .filter((wallet) => gasTokenBalanceMap[wallet.address].gte(maximumGas))
    .sort((a, b) => {
      // Sort ascending by priority.
      return a.priority - b.priority;
    });

  if (sortedAvailableWallets.length < 1) {
    const avWallets = activeWallets.filter((wallet) =>
      isWalletAvailable(wallet),
    );
    const outofFundsWallets = activeWallets.filter((wallet) =>
      gasTokenBalanceMap[wallet.address].gte(maximumGas),
    );
    logger.warn(
      `${avWallets.length} wallets available. ${
        outofFundsWallets.length
      } wallets have enough gas funds. (Need gas: ${maximumGas.toHexString()})`,
    );
    throw new Error(`All wallets busy or out of funds.`);
  }

  const bestWallet = sortedAvailableWallets[0];
  return bestWallet;
};
