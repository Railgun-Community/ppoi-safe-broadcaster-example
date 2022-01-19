import { BaseProvider } from '@ethersproject/providers';
import configNetworks from '../../config/config-networks';
import { createFallbackProviderFromJsonConfig } from './fallback-providers';
import { allNetworkChainIDs } from '../chains/network-chain-ids';
import { NetworkChainID } from '../../config/config-chain-ids';

const activeNetworkProviders: NumMapType<BaseProvider> = {};

export const initNetworkProviders = () => {
  allNetworkChainIDs().forEach((chainId) => {
    const { fallbackProviderConfig, name } = configNetworks[chainId];
    if (fallbackProviderConfig.chainId !== Number(chainId)) {
      throw new Error(
        `Fallback Provider chain ID ${fallbackProviderConfig.chainId} does not match ID ${chainId} for network: ${name}`,
      );
    }
    activeNetworkProviders[chainId] = createFallbackProviderFromJsonConfig(
      fallbackProviderConfig,
    );
  });
};

export const getProviderForNetwork = (chainID: NetworkChainID) => {
  return activeNetworkProviders[chainID];
};
