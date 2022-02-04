import { BaseProvider, FallbackProvider } from '@ethersproject/providers';
import configNetworks from '../config/config-networks';
import { createFallbackProviderFromJsonConfig } from './fallback-providers';
import { allNetworkChainIDs } from '../chains/network-chain-ids';
import { NetworkChainID } from '../config/config-chain-ids';
import { initLeptonNetwork } from '../lepton/lepton-init';

const activeNetworkProviders: NumMapType<FallbackProvider> = {};

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
    initLeptonNetwork(chainId);
  });
};

export const getProviderForNetwork = (
  chainID: NetworkChainID,
): FallbackProvider => {
  const provider = activeNetworkProviders[chainID];
  if (!provider) {
    throw new Error(`No active provider for chain ${chainID}.`);
  }
  return provider;
};
