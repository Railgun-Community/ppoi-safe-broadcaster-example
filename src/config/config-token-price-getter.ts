import { coingeckoPriceLookupByAddresses } from '../services/api/coingecko/coingecko-price';
import { TokenAddressesToPrice } from '../services/tokens/token-price-cache';
import { NetworkChainID } from './config-chain-ids';
import configNetworks from './config-networks';

export type TokenPricesGetter = (
  chainID: NetworkChainID,
  tokenAddresses: string[],
) => Promise<TokenAddressesToPrice>;

export const tokenPriceGetter = async (
  chainID: NetworkChainID,
  tokenAddresses: string[],
) => {
  const { coingeckoId } = configNetworks[chainID];
  if (!coingeckoId) {
    // TODO: Assign simple values for test nets without
    // price lookups available (Ropsten, HardHat).
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
