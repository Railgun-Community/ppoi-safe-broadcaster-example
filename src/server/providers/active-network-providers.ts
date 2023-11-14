import configNetworks from '../config/config-networks';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { loadEngineProvider } from '../engine/engine-init';
import { RelayerChain } from '../../models/chain-models';
import {
  createFallbackProviderFromJsonConfig,
  FallbackProviderJsonConfig,
  getAvailableProviderJSONs,
  isDefined,
} from '@railgun-community/shared-models';
import debug from 'debug';
import { FallbackProvider, JsonRpcProvider } from 'ethers';

const dbg = debug('relayer:networks');

const activeNetworkProviders: NumMapType<NumMapType<FallbackProvider>> = {};

// eslint-disable-next-line require-await
export const initNetworkProviders = async (chains?: RelayerChain[]) => {
  const initChains = chains ?? configuredNetworkChains();
  await Promise.all(
    initChains.map(async (chain) => {
      try {
        await initNetworkProvider(chain);
      } catch (err) {
        throw new Error(
          `Could not initialize network provider for chain: ${chain.type}:${chain.id} - ${err.message}`,
        );
      }
    }),
  );
};

/**
 * Note: This call is async, but you may call it synchronously
 * so it will run the slow scan in the background.
 */
const initNetworkProvider = async (chain: RelayerChain) => {
  const network = configNetworks[chain.type][chain.id];
  if (!isDefined(network)) {
    return;
  }
  const { fallbackProviderConfig, name } = network;
  if (fallbackProviderConfig.chainId !== chain.id) {
    throw new Error(
      `Fallback Provider chain ID ${fallbackProviderConfig.chainId} does not match ID ${chain.id} for network: ${name}`,
    );
  }

  const finalConfig: FallbackProviderJsonConfig = {
    chainId: fallbackProviderConfig.chainId,
    providers: [],
  };
  const availableProviders = await getAvailableProviderJSONs(
    fallbackProviderConfig.chainId,
    [...fallbackProviderConfig.providers],
    dbg,
  );
  finalConfig.providers = availableProviders;

  await loadEngineProvider(chain, finalConfig);

  const fallbackProvider = createFallbackProviderFromJsonConfig(finalConfig);
  activeNetworkProviders[chain.type] ??= {};
  activeNetworkProviders[chain.type][chain.id] = fallbackProvider;
  dbg(`Loaded network ${chain.type}:${chain.id}`);
};

export const getProviderForNetwork = (
  chain: RelayerChain,
): FallbackProvider => {
  const provider = activeNetworkProviders[chain.type][chain.id];
  if (!isDefined(provider)) {
    throw new Error(`No active provider for chain ${chain.type}:${chain.id}.`);
  }
  return provider;
};

export const getFirstJsonRpcProviderForNetwork = (
  chain: RelayerChain,
  useSecondary = false,
): JsonRpcProvider => {
  const fallbackProvider = getProviderForNetwork(chain);
  // first provider in this list, is used as pollingprovider in the wallet,
  // we shouldnt double up its usage.
  // if (fallbackProvider.provider.providerConfigs.length > 1 && useSecondary) {
  //   return fallbackProvider.provider.providerConfigs[1]
  //     .provider as JsonRpcProvider;
  // }
  return fallbackProvider.provider.providerConfigs[0]
    .provider as JsonRpcProvider;
};
