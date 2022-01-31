import { Wallet as EthersWallet } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { createEthersWallet, getActiveWallets } from './active-wallets';
import { isWalletAvailable } from './available-wallets';

export const getBestMatchWalletForNetwork = (
  chainID: NetworkChainID,
): EthersWallet => {
  // Simple sort:
  // - Availability (isProcessing).
  // - Priority.
  // - Amount of (gas token) available (TODO).
  const sortedAvailableWallets = getActiveWallets()
    .filter((wallet) => isWalletAvailable(wallet))
    .sort((a, b) => {
      // Sort ascending by priority.
      return a.priority - b.priority;
    });

  if (sortedAvailableWallets.length < 1) {
    throw new Error('No wallets available.');
  }

  const bestWallet = sortedAvailableWallets[0];
  const provider = getProviderForNetwork(chainID);
  return createEthersWallet(bestWallet, provider);
};
