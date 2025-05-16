import { ContractTransaction, Provider, parseUnits } from 'ethers';
import configTokens from '../server/config/config-tokens';
import { CoingeckoNetworkID } from '../models/api-constants';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';
import { Token, TokenConfig } from '../models/token-models';
import { BroadcasterChain } from '../models/chain-models';
import fallbackProvidersEthereum from '../server/config/fallback-providers/1-ethereum';
import fallbackProvidersEthereumGoerli from '../server/config/fallback-providers/5-ethereum-goerli';
import { Network } from '../models/network-models';

export const mockTokenConfig = (
  chain: BroadcasterChain,
  tokenAddress: string,
) => {
  // @ts-expect-error
  configTokens[chain.type] ??= {};
  configTokens[chain.type][chain.id] ??= {};
  configTokens[chain.type][chain.id][tokenAddress] = {
    symbol: tokenAddress.toUpperCase(),
  };
};

export const MOCK_TOKEN_6_DECIMALS = '0x03738239';

export const getMockProvider = (): Provider => {
  return null as unknown as Provider;
};

export const getMockNetwork = (): Network => {
  return {
    name: 'Ethereum',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress:
        NETWORK_CONFIG[NetworkName.Ethereum].baseToken.wrappedAddress,
      decimals: 18n,
      minBalanceForAvailability: 0.1,
    },
    fees: {
      gasEstimateVarianceBuffer: 0.03,
      gasEstimateLimitToActualRatio: 1.25,
      profit: 0.07,
    },
    // proxyContract: '0x00',
    // relayAdaptContract: '0x00',
    proxyContract: NETWORK_CONFIG[NetworkName.Ethereum].proxyContract,
    relayAdaptContract: NETWORK_CONFIG[NetworkName.Ethereum].relayAdaptContract,
    coingeckoNetworkId: CoingeckoNetworkID.Ethereum,
    fallbackProviderConfig: fallbackProvidersEthereum,
    deploymentBlock: 100,
    priceTTLInMS: 5 * 60 * 1000,
    retryGasBuffer: parseUnits('0.1', 'gwei'),
    topUp: {
      allowMultiTokenTopUp: true,
      accumulateNativeToken: true,
      toleratedSlippage: 0.01,
      maxSpendPercentage: 0.05,
      swapThresholdIntoGasToken: parseUnits('1', 18),
      minimumGasBalanceForTopup: parseUnits('0.5', 18),
      useZeroXForSwap: false,
    },
  };
};

export const getMockGoerliNetwork = (): Network => {
  return {
    name: 'Görli Testnet',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: '0x00',
      decimals: 18n,
      minBalanceForAvailability: 0.1,
    },
    fees: {
      gasEstimateVarianceBuffer: 0.05,
      gasEstimateLimitToActualRatio: 1.25,
      profit: 0.05,
    },
    proxyContract:
      NETWORK_CONFIG[NetworkName.EthereumGoerli_DEPRECATED].proxyContract,
    relayAdaptContract:
      NETWORK_CONFIG[NetworkName.EthereumGoerli_DEPRECATED].relayAdaptContract,
    deploymentBlock:
      NETWORK_CONFIG[NetworkName.EthereumGoerli_DEPRECATED].deploymentBlock,
    fallbackProviderConfig: fallbackProvidersEthereumGoerli,
    priceTTLInMS: 5 * 60 * 1000,
    isTestNetwork: true,
    retryGasBuffer: parseUnits('0.1', 'gwei'),
    topUp: {
      allowMultiTokenTopUp: true,
      accumulateNativeToken: true,
      toleratedSlippage: 0.01,
      maxSpendPercentage: 0.05,
      swapThresholdIntoGasToken: parseUnits('1', 18),
      minimumGasBalanceForTopup: parseUnits('0.5', 18),
      useZeroXForSwap: false,
    },
  };
};

export const getMockContractTransaction = (): ContractTransaction => {
  return {} as unknown as ContractTransaction;
};

export const getMockSerializedTransaction = (): string => {
  return JSON.stringify(getMockContractTransaction());
};

export const getMockTokenConfig = (symbol = 'SHIB'): TokenConfig => {
  return {
    symbol,
  };
};

export const getMockToken = (): Token => {
  return {
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    symbol: 'SHIB',
    decimals: 18n,
  };
};

export const getMockWalletAddress = (): string => {
  // Vitalik public address
  return '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
};
