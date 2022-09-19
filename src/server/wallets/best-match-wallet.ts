import { BigNumber } from 'ethers';
import { getActiveWalletGasTokenBalanceMapForChain } from '../balances/balance-cache';
import { getActiveWallets } from './active-wallets';
import { getAvailableWallets } from './available-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import { logger } from '../../util/logger';
import { RelayerChain } from '../../models/chain-models';

export const getBestMatchWalletForNetwork = async (
  chain: RelayerChain,
  minimumGasNeeded: BigNumber,
): Promise<ActiveWallet> => {
  const activeWallets = getActiveWallets();
  const gasTokenBalanceMap = await getActiveWalletGasTokenBalanceMapForChain(
    chain,
    activeWallets,
  );

  const availableWallets = await getAvailableWallets(activeWallets, chain);

  // Simple filters:
  // - Availability.
  // - Amount of (gas token) available.
  // Simple sort:
  // - Priority.
  const sortedAvailableWallets = availableWallets
    .filter((wallet) =>
      gasTokenBalanceMap[wallet.address].gte(minimumGasNeeded),
    )
    .sort((a, b) => {
      // Sort ascending by priority.
      return a.priority - b.priority;
    });

  if (sortedAvailableWallets.length < 1) {
    const outofFundsWallets = activeWallets.filter((wallet) =>
      gasTokenBalanceMap[wallet.address].lt(minimumGasNeeded),
    );
    logger.warn(
      `${availableWallets.length} wallets available. ${
        outofFundsWallets.length
      } wallets are out of gas funds. (Need gas: ${minimumGasNeeded.toHexString()})`,
    );
    throw new Error(`All wallets busy or out of funds.`);
  }

  const bestWallet = sortedAvailableWallets[0];
  return bestWallet;
};
