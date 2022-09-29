import { BaseProvider } from '@ethersproject/providers';
import { PopulatedTransaction } from 'ethers';
import configTokens from '../server/config/config-tokens';
import { CoingeckoNetworkID } from '../models/api-constants';
import {
  RailProxyContract,
  RelayAdaptContract,
} from '../models/contract-constants';
import { EVMGasType, Network } from '../models/network-models';
import { FallbackProviderJsonConfig } from '../models/provider-models';
import {
  GasTokenWrappedAddress,
  Token,
  TokenConfig,
} from '../models/token-models';
import { RelayerChain } from '../models/chain-models';
import { getPublicViewingKey } from '@railgun-community/engine/dist/utils/keys-utils';
import { randomBytes } from 'ethers/lib/utils';
import { RailgunEngine } from '@railgun-community/engine/dist/railgun-engine';
import { ViewingKeyPair } from '@railgun-community/engine/dist/key-derivation/wallet-node';

export const mockTokenConfig = (chain: RelayerChain, tokenAddress: string) => {
  // @ts-ignore
  configTokens[chain.type] ??= {};
  configTokens[chain.type][chain.id][tokenAddress] = {
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
      minimumBalanceForAvailability: 0.1,
    },
    fees: {
      slippageBuffer: 0.03,
      profit: 0.07,
    },
    proxyContract: '0x00' as RailProxyContract,
    relayAdaptContract: '0x00' as RelayAdaptContract,
    coingeckoNetworkId: CoingeckoNetworkID.Ethereum,
    fallbackProviderConfig: getMockFallbackProviderConfig(),
    priceTTLInMS: 5 * 60 * 1000,
    evmGasType: EVMGasType.Type2,
  };
};

export const getMockRopstenNetwork = (): Network => {
  return {
    name: 'Ropsten',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: '0x00',
      minimumBalanceForAvailability: 0.1,
    },
    fees: {
      slippageBuffer: 0.05,
      profit: 0.05,
    },
    proxyContract: RailProxyContract.Ropsten,
    relayAdaptContract: RelayAdaptContract.Ropsten,
    fallbackProviderConfig: getMockRopstenFallbackProviderConfig(),
    priceTTLInMS: 5 * 60 * 1000,
    isTestNetwork: true,
    evmGasType: EVMGasType.Type2,
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

export const getMockWalletViewingPublicKey = (): Uint8Array => {
  return RailgunEngine.decodeAddress(getMockWalletAddress()).viewingPublicKey;
};

export const mockViewingKeys = async () => {
  const privateViewingKey = randomBytes(32);
  const publicViewingKey = await getPublicViewingKey(privateViewingKey);
  const mockViewingKeys: ViewingKeyPair = {
    privateKey: privateViewingKey,
    pubkey: publicViewingKey,
  };
  return mockViewingKeys;
};
