import { FallbackProvider } from '@ethersproject/providers';
import configNetworks from '../config/config-networks';
import { createFallbackProviderFromJsonConfig } from './fallback-providers';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { initEngineNetwork } from '../lepton/lepton-init';
import { logger } from '../../util/logger';
import { RelayerChain } from '../../models/chain-models';

const activeNetworkProviders: NumMapType<NumMapType<FallbackProvider>> = {};

// eslint-disable-next-line require-await
export const initNetworkProviders = async (chains?: RelayerChain[]) => {
  const initChains = chains ?? configuredNetworkChains();
  initChains.forEach(async (chain) => {
    try {
      // eslint-disable-next-line no-await-in-loop
      await initNetworkProvider(chain);
    } catch (err: any) {
      logger.warn(
        `Could not init network ${chain.type}:${chain.id}. ${err.message}`,
      );
    }
  });
};

/**
 * Note: This call is async, but you may call it synchronously
 * so it will run the slow scan in the background.
 */
const initNetworkProvider = async (chain: RelayerChain) => {
  const network = configNetworks[chain.type][chain.id];
  if (!network) {
    return;
  }
  const { fallbackProviderConfig, name } = network;
  if (fallbackProviderConfig.chainId !== chain.id) {
    throw new Error(
      `Fallback Provider chain ID ${fallbackProviderConfig.chainId} does not match ID ${chain.id} for network: ${name}`,
    );
  }
  const fallbackProvider = createFallbackProviderFromJsonConfig(
    fallbackProviderConfig,
  );
  if (!activeNetworkProviders[chain.type]) {
    activeNetworkProviders[chain.type] = {};
  }
  activeNetworkProviders[chain.type][chain.id] = fallbackProvider;
  await initEngineNetwork(chain, fallbackProvider);
  logger.log(`Loaded network ${chain.type}:${chain.id}`);
};

export const getProviderForNetwork = (
  chain: RelayerChain,
): FallbackProvider => {
  const provider = activeNetworkProviders[chain.type][chain.id];
  if (!provider) {
    throw new Error(`No active provider for chain ${chain.type}:${chain.id}.`);
  }
  return provider;
};
