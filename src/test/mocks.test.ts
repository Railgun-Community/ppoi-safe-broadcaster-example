import { BaseProvider } from '@ethersproject/providers';
import { PopulatedTransaction } from 'ethers';
import configTokens from '../server/config/config-tokens';
import { CoingeckoNetworkID } from '../models/api-constants';
import {
  BaseTokenWrappedAddress,
  RailgunProxyContract,
  RelayAdaptContract,
} from '@railgun-community/shared-models';
import { Network } from '../models/network-models';
import { FallbackProviderJsonConfig } from '../models/provider-models';
import { Token, TokenConfig } from '../models/token-models';
import { RelayerChain } from '../models/chain-models';

export const mockTokenConfig = (chain: RelayerChain, tokenAddress: string) => {
  // @ts-ignore
  configTokens[chain.type] ??= {};
  configTokens[chain.type][chain.id] ??= {};
  configTokens[chain.type][chain.id][tokenAddress] = {
    symbol: tokenAddress.toUpperCase(),
  };
};

export const MOCK_TOKEN_6_DECIMALS = '0x03738239';

export const getMockEthereumFallbackProviderConfig =
  (): FallbackProviderJsonConfig => {
    return {
      chainId: 1,
      providers: [
        {
          provider: 'https://cloudflare-eth.com',
          priority: 2,
          weight: 1,
        },
      ],
    };
  };

const getMockGoerliFallbackProviderConfig = (): FallbackProviderJsonConfig => {
  return {
    chainId: 5,
    providers: [
      {
        provider:
          'https://eth-goerli.gateway.pokt.network/v1/lb/627a4b6e18e53a003a6b6c26',
        priority: 1,
        weight: 1,
      },
      {
        provider:
          'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        priority: 2,
        weight: 1,
      },
    ],
  };
};

export const getMockProvider = (): BaseProvider => {
  return new BaseProvider({ name: 'Ethereum', chainId: 1 });
};

export const getMockNetwork = (): Network => {
  return {
    name: 'Ethereum',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: BaseTokenWrappedAddress.EthereumWETH,
      decimals: 18,
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
    fallbackProviderConfig: getMockEthereumFallbackProviderConfig(),
    priceTTLInMS: 5 * 60 * 1000,
  };
};

export const getMockGoerliNetwork = (): Network => {
  return {
    name: 'Görli Testnet',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: '0x00',
      decimals: 18,
      minBalanceForAvailability: 0.1,
    },
    fees: {
      gasEstimateVarianceBuffer: 0.05,
      gasEstimateLimitToActualRatio: 1.25,
      profit: 0.05,
    },
    proxyContract: RailgunProxyContract.EthereumGoerli,
    relayAdaptContract: RelayAdaptContract.EthereumGoerli,
    fallbackProviderConfig: getMockGoerliFallbackProviderConfig(),
    priceTTLInMS: 5 * 60 * 1000,
    isTestNetwork: true,
  };
};

export const getMockPopulatedTransaction = (): PopulatedTransaction => {
  return {};
};

export const getMockSerializedTransaction = (): string => {
  return JSON.stringify(getMockPopulatedTransaction());
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
    decimals: 18,
  };
};

export const getMockWalletAddress = (): string => {
  // Vitalik public address
  return '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
};
