import configNetworks from '../config/config-networks';
import configTokenPriceRefresher, {
  TokenPriceRefresher,
} from '../config/config-token-price-refresher';
import { logger } from '../../util/logger';
import { delay } from '../../util/promise-utils';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import { allTokenAddressesForNetwork } from './network-tokens';
import { TokenPriceSource } from './token-price-cache';

let shouldPoll = true;

const pullAndCacheCurrentPricesForAllNetworks = async (
  tokenPriceRefresher: TokenPriceRefresher,
): Promise<void> => {
  const networkPriceRefreshers: Promise<void>[] = [];

  const chainIDs = configuredNetworkChainIDs();
  chainIDs.forEach((chainID) => {
    const tokenAddresses = allTokenAddressesForNetwork(chainID);
    const gasTokenAddress = configNetworks[chainID].gasToken.wrappedAddress;
    if (gasTokenAddress) {
      tokenAddresses.push(gasTokenAddress);
    }
    networkPriceRefreshers.push(
      tokenPriceRefresher.refresher(chainID, tokenAddresses),
    );
  });

  await Promise.all(networkPriceRefreshers);
};

const pollPrices = async (source: TokenPriceSource) => {
  const tokenPriceRefresher =
    configTokenPriceRefresher.tokenPriceRefreshers[source];
  try {
    await pullAndCacheCurrentPricesForAllNetworks(tokenPriceRefresher);
  } catch (err: any) {
    logger.warn('pollPrices error');
    logger.error(err);
  } finally {
    await delay(tokenPriceRefresher.refreshDelayInMS);
    if (shouldPoll) {
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
