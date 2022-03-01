import { FallbackProvider } from '@ethersproject/providers';
import configNetworks from '../config/config-networks';
import { createFallbackProviderFromJsonConfig } from './fallback-providers';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import { NetworkChainID } from '../config/config-chain-ids';
import { initLeptonNetwork } from '../lepton/lepton-init';
import { logger } from '../../util/logger';

const activeNetworkProviders: NumMapType<FallbackProvider> = {};

export const initNetworkProviders = () => {
  configuredNetworkChainIDs().forEach((chainID) => {
    try {
      initNetworkProvider(chainID);
    } catch (err: any) {
      logger.warn(`Could not init network ${chainID}. ${err.message}`);
    }
  });
};

const initNetworkProvider = (chainID: NetworkChainID) => {
  const network = configNetworks[chainID];
  if (!network) {
    return;
  }
  const { fallbackProviderConfig, name } = network;
  if (fallbackProviderConfig.chainId !== Number(chainID)) {
    throw new Error(
      `Fallback Provider chain ID ${fallbackProviderConfig.chainId} does not match ID ${chainID} for network: ${name}`,
    );
  }
  const fallbackProvider = createFallbackProviderFromJsonConfig(
    fallbackProviderConfig,
  );
  activeNetworkProviders[chainID] = fallbackProvider;
  initLeptonNetwork(chainID, fallbackProvider);
  logger.log(`Loaded network ${chainID}`);
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
