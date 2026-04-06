import { CoingeckoNetworkID } from '../../models/api-constants';
import * as zeroXPrice from '../api/0x/0x-price';
import * as coingeckoPrice from '../api/coingecko/coingecko-price';
import { BroadcasterChain } from '../../models/chain-models';
import * as defiLlamaPrice from '../api/defi-llama/defi-llama-price';
import * as uniswapPrice from '../api/uniswap/uniswap-price';
import { allTokenAddressesForNetwork } from '../tokens/network-tokens';
import {
  cacheTokenPriceForNetwork,
  TokenPrice,
  TokenPriceSource,
  TokenPriceUpdater,
} from '../tokens/token-price-cache';
import configNetworks from './config-networks';

export type TokenPriceRefresher = {
  enabled: boolean;
  refreshDelayInMS: number;
  refresher: (
    chain: BroadcasterChain,
    tokenAddresses: string[],
  ) => Promise<void>;
};


const updaterForPriceFetcher = (source: TokenPriceSource, chain: BroadcasterChain): TokenPriceUpdater => {
 return (
    tokenAddress: string,
    tokenPrice: TokenPrice,
  ) => cacheTokenPriceForNetwork(
    source,
    chain,
    tokenAddress,
    tokenPrice,
  );
}

const testFetcher = TokenPriceSource.DefiLlama

const priceFetcherSources = {
  [TokenPriceSource.DefiLlama]: (chain: BroadcasterChain, tokenAddresses: string[], updater: TokenPriceUpdater) => defiLlamaPrice.defiLlamaUpdatePricesByAddresses(chain, tokenAddresses, updater),
  [TokenPriceSource.CoinGecko]: (id: CoingeckoNetworkID, tokenAddresses: string[], updater: TokenPriceUpdater) => coingeckoPrice.coingeckoUpdatePricesByAddresses(id, tokenAddresses, updater),
  [TokenPriceSource.Uniswap]: (chain: BroadcasterChain, tokenAddresses: string[], updater: TokenPriceUpdater) => uniswapPrice.uniswapUpdatePricesByAddresses(chain, tokenAddresses, updater),
  [TokenPriceSource.ZeroX]: (chain: BroadcasterChain, tokenAddresses: string[], updater: TokenPriceUpdater) => zeroXPrice.zeroXUpdatePricesByAddresses(chain, tokenAddresses, updater),
}

const refresherForPriceFetcher = (
  source: TokenPriceSource,
) =>{

  return async (
    chain: BroadcasterChain,
    tokenAddresses: string[]
  ) => {

    const network = configNetworks[chain.type][chain.id];

    if (source !== testFetcher && (network.isTestNetwork ?? false)) {
      return Promise.resolve();
    }
    const updater = updaterForPriceFetcher(source, chain)

    const { coingeckoNetworkId } = network;
    if(!coingeckoNetworkId){
      if (network.isTestNetwork ?? false) {
        updateTestNetworkDefaultPrices(chain, updater);
      }
      return Promise.resolve();
    }

    if(source === TokenPriceSource.CoinGecko){
      return priceFetcherSources[source](
        coingeckoNetworkId as CoingeckoNetworkID,
        tokenAddresses,
        updater,
      )
    }

    return priceFetcherSources[source](
      chain,
      tokenAddresses,
      updater,
    )
  }

}

export const updateTestNetworkDefaultPrices = (
  chain: BroadcasterChain,
  updater: TokenPriceUpdater,
): void => {
  // Assigns simple values for test nets without
  // price lookups available (eg. Ropsten, Hardhat).
  const network = configNetworks[chain.type][chain.id];
  const tokenAddresses = allTokenAddressesForNetwork(chain);
  tokenAddresses.forEach((tokenAddress) => {
    updater(tokenAddress, {
      price: 2000.0, // Every token price.
      updatedAt: Date.now(),
    });
  });
  updater(network.gasToken.wrappedAddress, {
    price: 2000.0, // Gas price.
    updatedAt: Date.now(),
  });
};

export default {
  tokenPriceRefreshers: {
    [TokenPriceSource.DefiLlama]: {
      /**
       * Refresh token prices through DefiLlama every 30 seconds.
       */
      enabled: true,
      refreshDelayInMS: 30 * 1000,
      refresher: refresherForPriceFetcher(TokenPriceSource.DefiLlama),
    },
    [TokenPriceSource.Uniswap]: {
      /**
       * Refresh token prices from Uniswap every 30 seconds.
       * Please note not all tokens may be available on all networks.
       */
      enabled: true,
      refreshDelayInMS: 30 * 1000,
      refresher: refresherForPriceFetcher(TokenPriceSource.Uniswap),
    },
    [TokenPriceSource.CoinGecko]: {
      enabled: false,
      refreshDelayInMS: 60 * 1000,
      refresher: refresherForPriceFetcher(TokenPriceSource.CoinGecko),
    },
    [TokenPriceSource.ZeroX]: {
      enabled: false,
      refreshDelayInMS: 60 * 1000,
      refresher: refresherForPriceFetcher(TokenPriceSource.ZeroX),
    },
  },
} as { tokenPriceRefreshers: MapType<TokenPriceRefresher> };
