import { BaseProvider } from '@ethersproject/providers';
import { Wallet } from 'ethers';
import configNetworks from '../config/config-networks';
import configWallets from '../config/config-wallets';
import { ActiveWallet } from '../models/wallet-models';
import { initPricePoller } from './tokens/token-price-poller';
import { createFallbackProviderFromJsonConfig } from './providers/network-providers';
import { allNetworkChainIDs } from './chains/network-chain-ids';

const activeWallets: ActiveWallet[] = [];
const activeNetworks: NumMapType<BaseProvider> = {};

const initWallets = () => {
  configWallets.wallets.forEach(({ mnemonic }) => {
    const wallet = Wallet.fromMnemonic(mnemonic);
    activeWallets.push({
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
    });
  });
};

const initNetworks = () => {
  allNetworkChainIDs().forEach((chainId) => {
    const { fallbackProviderConfig, name } = configNetworks[chainId];
    if (fallbackProviderConfig.chainId !== Number(chainId)) {
      throw new Error(
        `Fallback Provider chain ID ${fallbackProviderConfig.chainId} does not match ID ${chainId} for network: ${name}`,
      );
    }
    activeNetworks[chainId] = createFallbackProviderFromJsonConfig(
      fallbackProviderConfig,
    );
  });
};

export const initRelayer = () => {
  initWallets();
  initNetworks();
  initPricePoller();
};
