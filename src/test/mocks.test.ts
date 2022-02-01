import { BaseProvider } from '@ethersproject/providers';
import { PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import configTokens from '../config/config-tokens';
import { CoingeckoNetworkID } from '../models/api-constants';
import { Network, QuickSyncURL } from '../models/network-models';
import { FallbackProviderJsonConfig } from '../models/provider-models';
import { GasTokenWrappedAddress, Token } from '../models/token-models';

export const mockTokenConfig = (
  chainID: NetworkChainID,
  tokenAddress: string,
  decimals = 18,
) => {
  configTokens[chainID][tokenAddress] = {
    symbol: tokenAddress.toUpperCase(),
    decimals,
  };
};

export const getMockFallbackProviderConfig = (): FallbackProviderJsonConfig => {
  return {
    chainId: 1,
    providers: [
      {
        provider: 'https://eth.railgun.ch',
        priority: 1,
        weight: 1,
      },
      {
        provider: 'https://cloudflare-eth.com',
        priority: 2,
        weight: 1,
      },
    ],
  };
};

export const getMockRopstenFallbackProviderConfig =
  (): FallbackProviderJsonConfig => {
    return {
      chainId: 3,
      providers: [
        {
          provider:
            'https://ropsten.infura.io/v3/84842078b09946638c03157f83405213',
          priority: 1,
          weight: 1,
        },
        {
          provider:
            'https://eth-rinkeby.gateway.pokt.network/v1/6004bd4d0040261633ade991',
          priority: 1,
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
      wrappedAddress: GasTokenWrappedAddress.EthereumWETH,
      decimals: 18,
    },
    fees: {
      slippageBuffer: 0.05,
      profit: 0.05,
    },
    railContract: '0x00',
    coingeckoId: CoingeckoNetworkID.Ethereum,
    fallbackProviderConfig: getMockFallbackProviderConfig(),
    priceTTLInMS: 5 * 60 * 1000,
  };
};

export const getMockRopstenNetwork = (): Network => {
  return {
    name: 'Ropsten',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: '0x00',
      decimals: 18,
    },
    fees: {
      slippageBuffer: 0.05,
      profit: 0.05,
    },
    railContract: '0x00',
    fallbackProviderConfig: getMockRopstenFallbackProviderConfig(),
    priceTTLInMS: 5 * 60 * 1000,
    quickSyncURL: QuickSyncURL.Ropsten,
  };
};

export const getMockPopulatedTransaction = (): PopulatedTransaction => {
  return {};
};

export const getMockSerializedTransaction = (): string => {
  return JSON.stringify(getMockPopulatedTransaction());
};

export const getMockToken = (): Token => {
  return {
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    symbol: 'SHIB',
    decimals: 18,
  };
};
