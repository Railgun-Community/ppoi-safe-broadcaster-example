import { BigNumber } from '@ethersproject/bignumber';
import { getActiveWalletGasTokenBalanceMapForChain } from '../balances/gas-balance-cache';
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

export const getBestMatchAvailableWalletForNetwork = async (
  chain: RelayerChain,
  minimumGasNeeded: BigNumber,
): Promise<ActiveWallet> => {
  const activeWallets = getActiveWalletsForChain(chain);
  const gasTokenBalanceMap = await getActiveWalletGasTokenBalanceMapForChain(
    chain,
    activeWallets,
  );

  const availableWallets = await getAvailableWallets(activeWallets, chain);

  const randomizeSelection = configDefaults.wallet.randomizeWalletSelection;
  const lastUsedWalletAddress = getLastUsedWalletAddressForChain(chain);
  const sortedAvailableWallets = availableWallets
    .filter((wallet) => {
      const balanceMet =
        gasTokenBalanceMap[wallet.address].gte(minimumGasNeeded);

      if (!balanceMet) {
        return false;
      }

      if (randomizeSelection && availableWallets.length > 1) {
        // Avoid using same wallet twice in a row.
        return wallet.address !== lastUsedWalletAddress;
      }

      return true;
    })
    .sort((a, b) => {
      if (!randomizeSelection) {
        return a.priority - b.priority;
      }
      if (gasTokenBalanceMap[a.address].lt(gasTokenBalanceMap[b.address])) {
        return 1;
      }
      if (gasTokenBalanceMap[a.address].gt(gasTokenBalanceMap[b.address])) {
        return -1;
      }
      return 0;
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

  if (randomizeSelection) {
    const randomSelectedWallet = randomElement(sortedAvailableWallets);
    if (randomSelectedWallet) {
      return randomSelectedWallet;
    }
  }

  return sortedAvailableWallets[0];
};
