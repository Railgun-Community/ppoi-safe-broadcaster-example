import { ContractTransaction, Provider } from 'ethers';
import configTokens from '../server/config/config-tokens';
import { CoingeckoNetworkID } from '../models/api-constants';
import {
  BaseTokenWrappedAddress,
  RailgunProxyContract,
  RelayAdaptContract,
} from '@railgun-community/shared-models';
import { Network } from '../models/network-models';
import { Token, TokenConfig } from '../models/token-models';
import { RelayerChain } from '../models/chain-models';
import fallbackProvidersEthereum from '../server/config/fallback-providers/1-ethereum';
import fallbackProvidersEthereumGoerli from '../server/config/fallback-providers/5-ethereum-goerli';

export const mockTokenConfig = (chain: RelayerChain, tokenAddress: string) => {
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
      wrappedAddress: BaseTokenWrappedAddress.EthereumWETH,
      decimals: 18n,
      minBalanceForAvailability: 0.1,
    },
    fees: {
      gasEstimateVarianceBuffer: 0.03,
      gasEstimateLimitToActualRatio: 1.25,
      profit: 0.07,
    },
    proxyContract: '0x00' as RailgunProxyContract,
    relayAdaptContract: '0x00' as RelayAdaptContract,
    coingeckoNetworkId: CoingeckoNetworkID.Ethereum,
    fallbackProviderConfig: fallbackProvidersEthereum,
    priceTTLInMS: 5 * 60 * 1000,
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
    proxyContract: RailgunProxyContract.EthereumGoerli,
    relayAdaptContract: RelayAdaptContract.EthereumGoerli,
    fallbackProviderConfig: fallbackProvidersEthereumGoerli,
    priceTTLInMS: 5 * 60 * 1000,
    isTestNetwork: true,
  };
};

export const getMockContractTransaction = (): ContractTransaction => {
  return {} as unknown as ContractTransaction;
};

export const getMockSerializedTransaction = (): string => {
  return JSON.stringify(getMockContractTransaction());
};

export const getMockTokenConfig = (): TokenConfig => {
  return {
    symbol: 'SHIB',
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
