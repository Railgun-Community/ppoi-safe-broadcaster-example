import { NetworkChainID } from './server/config/config-chains';
import configDefaults from './server/config/config-defaults';
import configNetworks from './server/config/config-networks';
import configTokens from './server/config/config-tokens';
import { ChainType, FallbackProviderJsonConfig } from '@railgun-community/shared-models';
import { parseUnits } from 'ethers';
import { AddressToTokenMap } from './models/config-models';
import { GAS_TOKEN_DECIMALS } from './models/token-models';

// MAKE CHANGES IN myConfigOverrides() BELOW
// MAKE CHANGES IN myConfigOverrides() BELOW
// MAKE CHANGES IN myConfigOverrides() BELOW
// HELPER FUNCTIONS
/**
 * Converts a number value to a token value.
 * @param value The number value to convert.
 * @returns The token value.
 */
const tokenValue = (value: number) => {
  return parseUnits(String(value), GAS_TOKEN_DECIMALS);
};
/**
 * Sets the maximum spend percentage for a specific network. This is the maximum percentage of the
 * expected gas token balance recieved that will be spent on a single transaction.
 * @param chainId - The chain ID of the network.
 * @param value - The maximum spend percentage value to set.
 */
export const setMaxSpendPercentageForNetwork = (
  chainId: NetworkChainID,
  value: number
) => {
  configNetworks[ChainType.EVM][chainId].topUp.maxSpendPercentage = value;
};
/**
 * Sets the amount to unshield for top-up on a specific network.
 *
 * @param chainId - The chain ID of the network.
 * @param value - The value to set as the top-up unshield amount.
 */
export const setTopUpUnshieldAmountForNetwork = (
  chainId: NetworkChainID,
  value: number
) => {
  configNetworks[ChainType.EVM][chainId].topUp.swapThresholdIntoGasToken = tokenValue(value);
};
/**
 * Sets the threshold to begin attempting top-up for a specific network.
 *
 * @param chainId - The chain ID of the network.
 * @param value - The value to set as the top-up begin threshold.
 */
export const setTopUpBeginThresholdForNetwork = (
  chainId: NetworkChainID,
  value: number
) => {
  configNetworks[ChainType.EVM][chainId].topUp.minimumGasBalanceForTopup = tokenValue(value);
};
/**
 * Sets the minimum availability balance for a specific network.
 *
 * @param chainId - The chain ID of the network.
 * @param value - The value to set as the minimum availability balance.
 */
export const setMinAvailabilityBalanceForNetwork = (
  chainId: NetworkChainID,
  value: number
) => {
  configNetworks[ChainType.EVM][chainId].gasToken.minBalanceForAvailability = value;
};
/**
 * Enables or disables native token accumulation for a specific network.
 * @param chainId - The chain ID of the network.
 * @param value - The value indicating whether native token accumulation should be enabled or disabled.
 */
export const setNativeTokenAccumulationForNetwork = (
  chainId: NetworkChainID,
  value: boolean
) => {
  configNetworks[ChainType.EVM][chainId].topUp.accumulateNativeToken = value;
};
/**
 * Sets the fallback provider configuration for a specific network chain ID.
 * @param chainId - The network chain ID.
 * @param config - The fallback provider JSON configuration.
 */
export const setFallbackProviderConfigForNetworkEVM = (
  chainId: NetworkChainID,
  config: FallbackProviderJsonConfig
) => {
  configNetworks[ChainType.EVM][chainId].fallbackProviderConfig = config;
};
/**
 * Sets the tokens for a specific network on the EVM chain.
 * @param chainId - The ID of the network chain.
 * @param tokens - The mapping of addresses to tokens.
 */
export const setTokensForNetworkEVM = (
  chainId: NetworkChainID,
  tokens: AddressToTokenMap
) => {
  configTokens[ChainType.EVM][chainId] = tokens;
};
/**
 * Sets the fees for a specific network in the EVM chain.
 * @param chainId - The ID of the network chain.
 * @param fees - The fees to be set for the network.
 */
export const setFeesForNetworkEVM = (
  chainId: NetworkChainID,
  fees: any
) => {
  configNetworks[ChainType.EVM][chainId].fees = fees;
};
/**
 * Sets the top-up chains in the configuration.
 * @param chains - An array of NetworkChainID representing the top-up chains.
 */
export const setTopUpOnChains = (chains: NetworkChainID[]) => {
  configDefaults.topUps.topUpChains = chains;
};
/**
 * Sets the tokens that should not be swapped.
 *
 * @param tokens - An array of tokens that should not be swapped.
 */
export const setDontSwapTokens = (tokens: string[]) => {
  configDefaults.topUps.shouldNotSwap = tokens;
};
/**
 * Sets the retry gas buffer for a specific network.
 * @param chainId - The chain ID of the network.
 * @param value - The value to set as the retry gas buffer.
 */
export const setRetryGasBufferForNetwork = (
  chainId: NetworkChainID,
  value: string
) => {
  configNetworks[ChainType.EVM][chainId].retryGasBuffer = parseUnits(value, 'gwei');
};
/**
 * Enables the top-up feature.
 */
export const enableTopUp = () => {
  configDefaults.topUps.shouldTopUp = true;
};

export const createFallbackProviderConfig = (chainId: number, url: string[]) => {
  const providers = url.map((url, index) => {
    const weights = index > 0 ? {
      priority: 3,
      weight: 3,
      maxLogsPerBatch: 2
    } : {
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 5
    };

    return {
      provider: url,
      sallTimeout: 2500,
      ...weights
    };
  });
  return {
    chainId,
    providers
  };
};
