import { BroadcasterChain } from '../../models/chain-models';
import { zeroXUpdatePricesByAddresses } from '../api/0x/0x-price';
import { coingeckoUpdatePricesByAddresses } from '../api/coingecko/coingecko-price';
import { uniswapUpdatePricesByAddresses } from '../api/uniswap/uniswap-price';
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

const tokenPriceRefresherCoingecko = (
  chain: BroadcasterChain,
  tokenAddresses: string[],
): Promise<void> => {
  const updater: TokenPriceUpdater = (
    tokenAddress: string,
    tokenPrice: TokenPrice,
  ) =>
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      chain,
      tokenAddress,
      tokenPrice,
    );

  const network = configNetworks[chain.type][chain.id];
  const { coingeckoNetworkId } = network;
  if (!coingeckoNetworkId) {
    if (network.isTestNetwork ?? false) {
      updateTestNetworkDefaultPrices(chain, updater);
    }
    return Promise.resolve();
  }

  return coingeckoUpdatePricesByAddresses(
    coingeckoNetworkId,
    tokenAddresses,
    updater,
  );
};

const tokenPriceRefresherZeroX = (
  chain: BroadcasterChain,
  tokenAddresses: string[],
): Promise<void> => {
  const network = configNetworks[chain.type][chain.id];
  if (network.isTestNetwork ?? false) {
    return Promise.resolve();
  }

  const updater: TokenPriceUpdater = (
    tokenAddress: string,
    tokenPrice: TokenPrice,
  ) =>
    cacheTokenPriceForNetwork(
      TokenPriceSource.ZeroX,
      chain,
      tokenAddress,
      tokenPrice,
    );

  return zeroXUpdatePricesByAddresses(chain, tokenAddresses, updater);
};

const tokenPriceRefresherUniswap = (
  chain: BroadcasterChain,
  tokenAddresses: string[],
): Promise<void> => {
  const updater: TokenPriceUpdater = (
    tokenAddress: string,
    tokenPrice: TokenPrice,
  ) =>
    cacheTokenPriceForNetwork(
      TokenPriceSource.Uniswap,
      chain,
      tokenAddress,
      tokenPrice,
    );

  const network = configNetworks[chain.type][chain.id];
  if (network.isTestNetwork ?? false) {
    return Promise.resolve();
  }
  return uniswapUpdatePricesByAddresses(chain, tokenAddresses, updater);
};

export default {
  tokenPriceRefreshers: {
    [TokenPriceSource.CoinGecko]: {
      /**
       * Refresh token prices through CoinGecko every 30 seconds.
       * Note that free Coingecko API tier only allows 50 requests per minute.
       */
      enabled: true,
      refreshDelayInMS: 30 * 1000,
      refresher: tokenPriceRefresherCoingecko,
    },
    [TokenPriceSource.ZeroX]: {
      /**
       * Kick off a token price refresh serially through 0x every minute.
       * Note that 0x API only allows 40 requests per minute, and 3 requests per second.
       * https://docs.0x.org/0x-api-swap/advanced-topics/rate-limiting
       * So, we automatically look up 20-40 tokens per minute through 0x API, depending on request latency.
       * Requests must be processed serially because of the 0x API rate limit.
       * If a refresh is ongoing, we will skip the next request for a refresh.
       */
      enabled: false, // requires 0x API key | disabled by default
      refreshDelayInMS: 60 * 1000,
      refresher: tokenPriceRefresherZeroX,
    },
    [TokenPriceSource.Uniswap]: {
      /**
       * Refresh token prices from Uniswap every 30 seconds.
       * Please note not all tokens may be available on all networks.
       */
      enabled: true,
      refreshDelayInMS: 30 * 1000,
      refresher: tokenPriceRefresherUniswap,
    },
  },
} as { tokenPriceRefreshers: MapType<TokenPriceRefresher> };
