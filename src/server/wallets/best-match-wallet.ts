import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { getActiveWalletGasTokenBalanceMapForChain } from '../balances/balance-cache';
import { getActiveWallets } from './active-wallets';
import { getAvailableWallets } from './available-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import { logger } from '../../util/logger';

export const getBestMatchWalletForNetwork = async (
  chainID: NetworkChainID,
  maximumGas: BigNumber,
): Promise<ActiveWallet> => {
  const activeWallets = getActiveWallets();
  const gasTokenBalanceMap = await getActiveWalletGasTokenBalanceMapForChain(
    chainID,
    activeWallets,
  );

  const availableWallets = await getAvailableWallets(activeWallets, chainID);

  // Simple filters:
  // - Availability.
  // - Amount of (gas token) available.
  // Simple sort:
  // - Priority.
  const sortedAvailableWallets = availableWallets
    .filter((wallet) => gasTokenBalanceMap[wallet.address].gte(maximumGas))
    .sort((a, b) => {
      // Sort ascending by priority.
      return a.priority - b.priority;
    });

  if (sortedAvailableWallets.length < 1) {
    const outofFundsWallets = activeWallets.filter((wallet) =>
      gasTokenBalanceMap[wallet.address].gte(maximumGas),
    );
    logger.warn(
      `${availableWallets.length} wallets available. ${
        outofFundsWallets.length
      } wallets have enough gas funds. (Need gas: ${maximumGas.toHexString()})`,
    );
    throw new Error(`All wallets busy or out of funds.`);
  }

  const bestWallet = sortedAvailableWallets[0];
  return bestWallet;
};
