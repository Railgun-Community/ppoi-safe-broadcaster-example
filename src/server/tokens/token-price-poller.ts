import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import configTokenPriceGetter, {
  TokenPricesGetter,
} from '../config/config-token-price-getter';
import { logger } from '../../util/logger';
import { delay } from '../../util/promise-utils';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import { allTokenAddressesForNetwork } from './network-tokens';
import {
  cacheTokenPricesForNetwork,
  TokenAddressesToPrice,
} from './token-price-cache';

let shouldPoll = true;

const pullAndCacheCurrentPricesForAllNetworks = async (
  tokenPricesGetter: TokenPricesGetter,
): Promise<void> => {
  const networkPromises: Promise<TokenAddressesToPrice>[] = [];

  const chainIDs = configuredNetworkChainIDs();
  chainIDs.forEach((chainID) => {
    const tokenAddresses = allTokenAddressesForNetwork(chainID);
    const gasTokenAddress = configNetworks[chainID].gasToken.wrappedAddress;
    if (gasTokenAddress) {
      tokenAddresses.push(gasTokenAddress);
    }
    networkPromises.push(tokenPricesGetter(chainID, tokenAddresses));
  });

  const networkTokenPrices = await Promise.all(networkPromises);
  chainIDs.forEach((chainID, index) => {
    const tokenPrices = networkTokenPrices[index];
    cacheTokenPricesForNetwork(chainID, tokenPrices);
  });
};

const pollPrices = async (tokenPricesGetter: TokenPricesGetter) => {
  try {
    await pullAndCacheCurrentPricesForAllNetworks(tokenPricesGetter);
  } catch (err: any) {
    logger.error(err);
  } finally {
    await delay(configDefaults.tokenPriceRefreshDelayInMS);
    if (shouldPoll) {
      pollPrices(tokenPricesGetter);
    }
  }
};

export const stopPolling = () => {
  shouldPoll = false;
};

export const initPricePoller = () => {
  shouldPoll = true;
  pollPrices(configTokenPriceGetter.tokenPriceGetter);
};
