import { BigNumber, Wallet as EthersWallet } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { getActiveWalletGasTokenBalanceMapForChain } from '../balances/balance-cache';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { createEthersWallet, getActiveWallets } from './active-wallets';
import { isWalletAvailable } from './available-wallets';

export const getBestMatchWalletForNetwork = async (
  chainID: NetworkChainID,
  gasLimit: BigNumber,
): Promise<EthersWallet> => {
  const gasTokenBalanceMap = await getActiveWalletGasTokenBalanceMapForChain(
    chainID,
  );

  // Simple filters:
  // - Availability.
  // - Amount of (gas token) available.
  // Simple sort:
  // - Priority.
  const sortedAvailableWallets = getActiveWallets()
    .filter((wallet) => isWalletAvailable(wallet))
    .filter((wallet) => gasTokenBalanceMap[wallet.address].gte(gasLimit))
    .sort((a, b) => {
      // Sort ascending by priority.
      return a.priority - b.priority;
    });

  if (sortedAvailableWallets.length < 1) {
    throw new Error('All wallets busy or out of funds.');
  }

  const bestWallet = sortedAvailableWallets[0];
  const provider = getProviderForNetwork(chainID);
  return createEthersWallet(bestWallet, provider);
};
