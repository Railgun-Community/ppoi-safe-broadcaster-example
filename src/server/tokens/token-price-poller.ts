import configNetworks from '../config/config-networks';
import configTokenPriceRefresher, {
  TokenPriceRefresher,
} from '../config/config-token-price-refresher';
import { logger } from '../../util/logger';
import { delay } from '../../util/promise-utils';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { allTokenAddressesForNetwork } from './network-tokens';
import { TokenPriceSource } from './token-price-cache';
import debug from 'debug';

let shouldPoll = true;

const dbg = debug('relayer:price-poller');

const pullAndCacheCurrentPricesForAllNetworks = async (
  tokenPriceRefresher: TokenPriceRefresher,
): Promise<void> => {
  const chains = configuredNetworkChains();
  for (const chain of chains) {
    const tokenAddresses = allTokenAddressesForNetwork(chain);
    const gasTokenAddress =
      configNetworks[chain.type][chain.id].gasToken.wrappedAddress;
    if (gasTokenAddress) {
      tokenAddresses.push(gasTokenAddress);
    }
    // eslint-disable-next-line no-await-in-loop
    await tokenPriceRefresher.refresher(chain, tokenAddresses);
  }
};

const pollPrices = async (source: TokenPriceSource) => {
  const tokenPriceRefresher =
    configTokenPriceRefresher.tokenPriceRefreshers[source];
  try {
    await pullAndCacheCurrentPricesForAllNetworks(tokenPriceRefresher);
  } catch (err) {
    dbg('pollPrices error');
    dbg(err);
  } finally {
    await delay(tokenPriceRefresher.refreshDelayInMS);
    if (shouldPoll) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      pollPrices(source);
    }
  }
};

export const stopTokenPricePolling = () => {
  shouldPoll = false;
};

export const initPricePoller = () => {
  shouldPoll = true;
  const priceSources = Object.keys(
    configTokenPriceRefresher.tokenPriceRefreshers,
  ) as TokenPriceSource[];
  for (const priceSource of priceSources) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    pollPrices(priceSource);
    // eslint-disable-next-line no-await-in-loop
    // await delay(5 * 1000); // give it 60 seconds
  }
  dbg('Price Pollers Initialized.');
};
