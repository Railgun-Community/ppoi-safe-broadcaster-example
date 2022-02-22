import { coingeckoPriceLookupByAddresses } from '../api/coingecko/coingecko-price';
import { allTokenAddressesForNetwork } from '../tokens/network-tokens';
import { TokenAddressesToPrice } from '../tokens/token-price-cache';
import { NetworkChainID } from './config-chain-ids';
import configNetworks from './config-networks';

export type TokenPricesGetter = (
  chainID: NetworkChainID,
  tokenAddresses: string[],
) => Promise<TokenAddressesToPrice>;

export const getTestNetworkDefaultPrices = (
  chainID: NetworkChainID,
): TokenAddressesToPrice => {
  // Assigns simple values for test nets without
  // price lookups available (eg. Ropsten, HardHat).
  const network = configNetworks[chainID];
  const tokenAddresses = allTokenAddressesForNetwork(chainID);
  const tokenAddressesToPrice: TokenAddressesToPrice = {};
  tokenAddresses.forEach((tokenAddress) => {
    tokenAddressesToPrice[tokenAddress.toLowerCase()] = {
      price: 2000.0, // Every token price.
      updatedAt: Date.now(),
    };
  });
  tokenAddressesToPrice[network.gasToken.wrappedAddress.toLowerCase()] = {
    price: 2000.0, // Gas price.
    updatedAt: Date.now(),
  };
  return tokenAddressesToPrice;
};

const tokenPriceGetter = async (
  chainID: NetworkChainID,
  tokenAddresses: string[],
): Promise<TokenAddressesToPrice> => {
  const network = configNetworks[chainID];
  const { coingeckoId } = network;
  if (!coingeckoId) {
    if (network.isTestNetwork) {
      return getTestNetworkDefaultPrices(chainID);
    }
    return {};
  }
  const tokenAddressesToPrice = await coingeckoPriceLookupByAddresses(
    coingeckoId,
    tokenAddresses,
  );
  return tokenAddressesToPrice;
};

export default {
  tokenPriceGetter,
} as { tokenPriceGetter: TokenPricesGetter };
