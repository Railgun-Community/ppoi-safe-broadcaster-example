import { delay, isDefined } from '@railgun-community/shared-models';
import { CoingeckoNetworkID } from '../../../models/api-constants';
import { TokenPrice, TokenPriceUpdater } from '../../tokens/token-price-cache';
import { CoingeckoApiEndpoint, getCoingeckoData } from './coingecko-fetch';

type TokenAddressPrice = {
  tokenAddress: string;
  tokenPrice: TokenPrice;
};

type CoingeckoPriceData = {
  last_updated_at: number;
};
type CoingeckoPriceMap = MapType<CoingeckoPriceData>;

const tokenPriceArrayFromCoingeckoPriceMap = (
  coingeckoPriceMap: CoingeckoPriceMap,
  currency: string,
): TokenAddressPrice[] => {
  const tokenPrices: TokenAddressPrice[] = [];

  Object.keys(coingeckoPriceMap).forEach((tokenAddress) => {
    const coingeckoPriceData = coingeckoPriceMap[tokenAddress];
    if (!isDefined(coingeckoPriceData)) return; // Token price not found.

    tokenPrices.push({
      tokenAddress,
      tokenPrice: {
        updatedAt: coingeckoPriceData.last_updated_at * 1000, // Convert Sec to MSec
        price: Number((coingeckoPriceData as any)[currency]),
      },
    });
  });

  return tokenPrices;
};

const coingeckoPriceLookup = async (
  coingeckoNetworkId: CoingeckoNetworkID,
  tokenAddresses: string[],
): Promise<TokenAddressPrice[]> => {
  const currency = 'usd';

  let coingeckoPriceMap: CoingeckoPriceMap = {};
  try {
    const geckoPriceMap: CoingeckoPriceMap = await getCoingeckoData(
      CoingeckoApiEndpoint.PriceLookup,
      coingeckoNetworkId,
      {
        contract_addresses: tokenAddresses.join(','),
        vs_currencies: currency,
        include_last_updated_at: true,
      },
    );
    coingeckoPriceMap = { ...coingeckoPriceMap, ...geckoPriceMap };
  } catch (error) {
    console.error(error);
  }

  const tokenPrices = tokenPriceArrayFromCoingeckoPriceMap(
    coingeckoPriceMap,
    currency,
  );
  return tokenPrices;
};

export const coingeckoUpdatePricesByAddresses = async (
  coingeckoNetworkId: CoingeckoNetworkID,
  tokenAddresses: string[],
  updater: TokenPriceUpdater,
): Promise<void> => {
  const batchSize = 30; // CoinGecko Demo API tier limit is 30 addresses per request
  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    const batch = tokenAddresses.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    const batchTokenAddressPrices = await coingeckoPriceLookup(
      coingeckoNetworkId,
      batch,
    );
    // eslint-disable-next-line no-await-in-loop
    await delay(1000);
    batchTokenAddressPrices.forEach(({ tokenAddress, tokenPrice }) =>
      updater(tokenAddress, tokenPrice),
    );
  }
  await delay(1000);
};
