import configDefaults from '../../config/config-defaults';
import configNetworks from '../../config/config-networks';
import {
  configTokenPricesGetter,
  TokenPricesGetter,
} from '../../config/config-token-price-getter';
import configTokens from '../../config/config-tokens';
import { logger } from '../../util/logger';
import { delay } from '../../util/promise-utils';
import { allNetworkChainIDs } from '../chains/network-chain-ids';
import { calculateFee } from '../fees/calculate-fee';
import { allTokenAddressesForNetwork } from './network-tokens';
import {
  cacheTokenPricesForNetwork,
  TokenAddressesToPrice,
} from './token-price-cache';

const pullAndCacheCurrentPricesForAllNetworks = async (
  tokenPricesGetter: TokenPricesGetter,
): Promise<void> => {
  const networkPromises: Promise<TokenAddressesToPrice>[] = [];

  const chainIDs = allNetworkChainIDs();
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
    //
    // NOTE: Helpful to test fee calculator:
    // await calculateFee(
    //   1,
    //   '0xdac17f958d2ee523a2206206994597c13d831ec7',
    //   undefined,
    // );
    //
  } catch (err) {
    logger.error(err);
  } finally {
    await delay(configDefaults.tokenPriceRefreshDelayInMS);
    pollPrices(tokenPricesGetter);
  }
};

export const initPricePoller = () => {
  pollPrices(configTokenPricesGetter);
};
