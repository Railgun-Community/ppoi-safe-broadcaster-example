import configNetworks from '../config/config-networks';
import configTokenPriceRefresher, {
  TokenPriceRefresher,
} from '../config/config-token-price-refresher';
import { logger } from '../../util/logger';
import { delay } from '../../util/promise-utils';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { allTokenAddressesForNetwork } from './network-tokens';
import { TokenPriceSource } from './token-price-cache';

let shouldPoll = true;

const pullAndCacheCurrentPricesForAllNetworks = async (
  tokenPriceRefresher: TokenPriceRefresher,
): Promise<void> => {
  const networkPriceRefreshers: Promise<void>[] = [];

  const chains = configuredNetworkChains();
  chains.forEach((chain) => {
    const tokenAddresses = allTokenAddressesForNetwork(chain);
    const gasTokenAddress =
      configNetworks[chain.type][chain.id].gasToken.wrappedAddress;
    if (gasTokenAddress) {
      tokenAddresses.push(gasTokenAddress);
    }
    networkPriceRefreshers.push(
      tokenPriceRefresher.refresher(chain, tokenAddresses),
    );
  });

  await Promise.all(networkPriceRefreshers);
};

const pollPrices = async (source: TokenPriceSource) => {
  const tokenPriceRefresher =
    configTokenPriceRefresher.tokenPriceRefreshers[source];
  try {
    await pullAndCacheCurrentPricesForAllNetworks(tokenPriceRefresher);
  } catch (err) {
    logger.warn('pollPrices error');
    logger.error(err);
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
  const sources = Object.keys(
    configTokenPriceRefresher.tokenPriceRefreshers,
  ) as TokenPriceSource[];
  sources.forEach((source) => pollPrices(source));
};
