import { TokenAddressesToPrice } from '../../tokens/token-price-cache';
import { CoingeckoApiEndpoint, getCoingeckoData } from './coingecko-fetch';

type CoingeckoPriceData = {
  last_updated_at: number;
};
type CoingeckoPriceMap = MapType<CoingeckoPriceData>;

const tokenPriceMapFromCoingeckoPriceMap = (
  coingeckoPriceMap: CoingeckoPriceMap,
  currency: string,
): TokenAddressesToPrice => {
  const tokenPriceMap: TokenAddressesToPrice = {};

  Object.keys(coingeckoPriceMap).forEach((tokenAddress) => {
    const coingeckoPriceData = coingeckoPriceMap[tokenAddress];
    if (!coingeckoPriceData) return; // Token price not found.

    tokenPriceMap[tokenAddress.toLowerCase()] = {
      updatedAt: coingeckoPriceData.last_updated_at * 1000, // Convert Sec to MSec
      price: Number(coingeckoPriceData[currency]),
    };
  });

  return tokenPriceMap;
};

export const coingeckoPriceLookupByAddresses = async (
  coingeckoNetworkId: string,
  tokenAddresses: string[],
  currency = 'usd',
): Promise<TokenAddressesToPrice> => {
  if (!tokenAddresses.length) {
    return {};
  }
  const params = {
    contract_addresses: tokenAddresses.join(','),
    vs_currencies: currency,
    include_last_updated_at: true,
  };
  const coingeckoPriceMap: CoingeckoPriceMap = await getCoingeckoData(
    CoingeckoApiEndpoint.PriceLookup,
    coingeckoNetworkId,
    params,
  );

  const tokenPriceMap = tokenPriceMapFromCoingeckoPriceMap(
    coingeckoPriceMap,
    currency,
  );
  return tokenPriceMap;
};
