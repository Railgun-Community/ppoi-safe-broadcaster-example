import { Wallet as EthersWallet } from 'ethers';
import clientConfigWallets from '../config/client-config-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import { NetworkChainID } from '../../server/config/config-chain-ids';
import { getProviderForNetwork } from '../../server/providers/active-network-providers';

const activeClientWallets: ActiveWallet[] = [];

export const initClientWallets = () => {
  clientConfigWallets.wallets.forEach(async ({ mnemonic, priority }) => {
    const wallet = EthersWallet.fromMnemonic(mnemonic);
    activeClientWallets.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic,
      priority,
      isShieldedReceiver: false,
    });
  });
};

export const getClientWalletForIndex = (
  i: number,
  chainID: NetworkChainID,
): EthersWallet => {
  if (activeClientWallets.length < i + 1) {
    throw new Error('Client wallet index out of bounds.');
  }
  const provider = getProviderForNetwork(chainID);
  return new EthersWallet(activeClientWallets[i].privateKey, provider);
};
