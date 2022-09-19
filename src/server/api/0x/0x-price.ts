import { RelayerChain } from '../../../models/chain-models';
import { delay } from '../../../util/promise-utils';
import { tokenForAddress } from '../../tokens/network-tokens';
import { TokenPrice, TokenPriceUpdater } from '../../tokens/token-price-cache';
import { ZeroXApiEndpoint, getZeroXData } from './0x-fetch';

// 1.5 second delay; 40 per minute maximum.
// https://docs.0x.org/0x-api-swap/advanced-topics/rate-limiting
let ZERO_X_PRICE_LOOKUP_DELAY = 1500;

const refreshLocks: NumMapType<NumMapType<boolean>> = {};

export type ZeroXPriceData = {
  price: string;
};

export type ZeroXPriceParams = {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
};

export const overrideZeroXPriceLookupDelay_TEST_ONLY = (
  overrideDelay: number,
) => {
  ZERO_X_PRICE_LOOKUP_DELAY = overrideDelay;
};

type ZeroXFormattedPriceData = {
  price: number;
};

const zeroXPriceLookupByAddress = async (
  chain: RelayerChain,
  tokenAddress: string,
): Promise<Optional<ZeroXFormattedPriceData>> => {
  try {
    const { decimals, symbol } = tokenForAddress(chain, tokenAddress);

    // TODO: This depends on DAI being stable at $1.
    // As we've seen, this isn't the safest methodology.
    // However, if the price of DAI drops, the broadcasted fees can only increase,
    // so for this use case, it is not harmful.

    if (symbol === 'DAI') {
      return { price: 1 };
    }
    const sellAmount = (10 ** decimals).toString(10);
    const params: ZeroXPriceParams = {
      sellToken: tokenAddress,
      buyToken: 'DAI',
      sellAmount, // 1 token
    };
    const { price } = await getZeroXData<ZeroXPriceData>(
      ZeroXApiEndpoint.PriceLookup,
      chain,
      params,
    );
    return {
      price: parseFloat(price),
    };
  } catch (err) {
    return undefined;
  }
};

export const zeroXUpdatePricesByAddresses = async (
  chain: RelayerChain,
  tokenAddresses: string[],
  updater: TokenPriceUpdater,
): Promise<void> => {
  refreshLocks[chain.type] ??= {};
  if (refreshLocks[chain.type][chain.id]) {
    // Continue refreshing 0x prices.
    return;
  }
  refreshLocks[chain.type][chain.id] = true;

  for (const tokenAddress of tokenAddresses) {
    // eslint-disable-next-line no-await-in-loop
    const zeroXPriceData = await zeroXPriceLookupByAddress(chain, tokenAddress);
    if (zeroXPriceData) {
      const tokenPrice: TokenPrice = {
        price: zeroXPriceData.price,
        updatedAt: Date.now(),
      };
      updater(tokenAddress, tokenPrice);
    }

    // eslint-disable-next-line no-await-in-loop
    await delay(ZERO_X_PRICE_LOOKUP_DELAY);
  }

  refreshLocks[chain.type][chain.id] = false;
};
