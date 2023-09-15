import { getActiveWalletGasTokenBalanceMapForChain } from '../balances/balance-cache';
import { getActiveWalletsForChain } from './active-wallets';
import {
  getAvailableWallets,
  getLastUsedWalletAddressForChain,
} from './available-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import { logger } from '../../util/logger';
import { RelayerChain } from '../../models/chain-models';
import configDefaults from '../config/config-defaults';
import { randomElement } from '../../util/utils';
import { ErrorMessage } from '../../util/errors';

export const getBestMatchWalletForNetwork = async (
  chain: RelayerChain,
  minimumGasNeeded: bigint,
): Promise<ActiveWallet> => {
  const activeWallets = getActiveWalletsForChain(chain);
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
  const randomizeSelection = configDefaults.wallet.randomizeWalletSelection;
  const lastUsedWalletAddress = getLastUsedWalletAddressForChain(chain);
  const sortedAvailableWallets = availableWallets
    .filter((wallet) => {
      const balanceMet = gasTokenBalanceMap[wallet.address] >= minimumGasNeeded;
      if (randomizeSelection) {
        // if we're using random select,
        // balance for tx must be still met.

        // so if we only have 1 wallet left, we base the check soley on balance.
        //    - falls through to bottom.
        // if we have more than 1 available wallet
        //    - filter out last wallet used
        //    - check balance requirement
        if (availableWallets.length > 1) {
          // Filter out last used wallet.
          return wallet.address !== lastUsedWalletAddress && balanceMet;
        }
      }

      return balanceMet;
    })
    .sort((a, b) => {
      if (!randomizeSelection) {
        return a.priority - b.priority;
      }
      if (gasTokenBalanceMap[a.address] < gasTokenBalanceMap[b.address]) {
        return 1;
      }
      if (gasTokenBalanceMap[a.address] > gasTokenBalanceMap[b.address]) {
        return -1;
      }
      return 0;
    });

  if (sortedAvailableWallets.length < 1) {
    const outofFundsWallets = activeWallets.filter(
      (wallet) => gasTokenBalanceMap[wallet.address] < minimumGasNeeded,
    );
    logger.warn(
      `${availableWallets.length} wallets available. ${outofFundsWallets.length} wallets are out of gas funds. (Need gas: ${minimumGasNeeded})`,
    );
    throw new Error(ErrorMessage.RELAYER_OUT_OF_GAS);
  }

  if (randomizeSelection) {
    const randomSelectedWallet = randomElement(sortedAvailableWallets);
    if (randomSelectedWallet) {
      return randomSelectedWallet;
    }
  }

  return sortedAvailableWallets[0];
};
