import { BaseProvider } from '@ethersproject/providers';
import { Wallet } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configWallets from '../../config/config-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import { getProviderForNetwork } from '../providers/active-network-providers';

const activeWallets: ActiveWallet[] = [];

export const initWallets = () => {
  configWallets.wallets.forEach(({ mnemonic }) => {
    const wallet = Wallet.fromMnemonic(mnemonic);
    activeWallets.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
  });
};

export const walletForIndex = (index: number, provider: BaseProvider) => {
  return new Wallet(activeWallets[index].privateKey, provider);
};

export const getAnyWalletForNetwork = (chainID: NetworkChainID) => {
  if (activeWallets.length < 1) {
    throw new Error('No wallets initialized.');
  }
  const provider = getProviderForNetwork(chainID);
  return walletForIndex(0, provider);
};
