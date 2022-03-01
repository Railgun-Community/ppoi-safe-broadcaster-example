import { BaseProvider } from '@ethersproject/providers';
import { babyjubjub } from '@railgun-community/lepton/dist/utils';
import { PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../server/config/config-chain-ids';
import configTokens from '../server/config/config-tokens';
import { CoingeckoNetworkID } from '../models/api-constants';
import { RailProxyContract } from '../models/contract-constants';
import { Network, QuickSyncURL } from '../models/network-models';
import { FallbackProviderJsonConfig } from '../models/provider-models';
import {
  GasTokenWrappedAddress,
  Token,
  TokenConfig,
} from '../models/token-models';
import { initTokens } from '../server/tokens/network-tokens';

export const mockTokenConfig = (
  chainID: NetworkChainID,
  tokenAddress: string,
) => {
  configTokens[chainID][tokenAddress] = {
    symbol: tokenAddress.toUpperCase(),
  };
};

export const MOCK_TOKEN_6_DECIMALS = '0x03738239';

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
    },
    fees: {
      slippageBuffer: 0.05,
      profit: 0.05,
    },
    proxyContract: '0x00' as RailProxyContract,
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
    },
    fees: {
      slippageBuffer: 0.05,
      profit: 0.05,
    },
    proxyContract: RailProxyContract.Ropsten,
    fallbackProviderConfig: getMockRopstenFallbackProviderConfig(),
    priceTTLInMS: 5 * 60 * 1000,
    quickSyncURL: QuickSyncURL.Ropsten,
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

export const getMockWalletPubKey = (): string => {
  const privateKey =
    '0f75f0f0f1e2d1021b1d7f839bea176d24c87e089ee959c6fb9c0e650473d684';
  return babyjubjub.privateKeyToPubKey(privateKey);
};
