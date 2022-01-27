import { BaseProvider } from '@ethersproject/providers';
import { PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import configTokens from '../config/config-tokens';
import { Network } from '../models/network-models';
import { FallbackProviderJsonConfig } from '../models/provider-models';

export const mockTokenConfig = (
  chainID: NetworkChainID,
  tokenAddress: string,
) => {
  configTokens[chainID][tokenAddress] = {
    symbol: tokenAddress.toUpperCase(),
    decimals: 18,
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

export const getMockProvider = (): BaseProvider => {
  return new BaseProvider({ name: 'Ethereum', chainId: 1 });
};

export const getMockNetwork = (): Network => {
  return {
    name: 'Ethereum',
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
    coingeckoId: 'ethereum',
    fallbackProviderConfig: getMockFallbackProviderConfig(),
    priceTTLInMS: 5 * 60 * 1000,
  };
};

export const getMockPopulatedTransaction = (): PopulatedTransaction => {
  return {};
};

export const getMockSerializedTransaction = (): string => {
  return JSON.stringify(getMockPopulatedTransaction());
};
