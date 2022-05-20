import axios from 'axios';
import configDefaults from '../../config/config-defaults';
import { CoingeckoNetworkID } from '../../../models/api-constants';
import { logger } from '../../../util/logger';

const PRO_API_KEY = configDefaults.tokenPrices.api.coingeckoProApiKey;

const COINGECKO_API_URL = PRO_API_KEY
  ? 'https://pro-api.coingecko.com/api/v3/'
  : 'https://api.coingecko.com/api/v3/';

export enum CoingeckoApiEndpoint {
  PriceLookupByID = 'simple/price/',
  PriceLookup = 'simple/token_price/',
}

const paramString = (params?: MapType<any>) => {
  if (!params) {
    return '';
  }
  // TODO: Add (opt) configurable Coingecko API key.
  const searchParams = new URLSearchParams(params);

  if (PRO_API_KEY) {
    searchParams.append('x_cg_pro_api_key', PRO_API_KEY);
  }

  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

const createUrl = (
  endpoint: CoingeckoApiEndpoint,
  coingeckoNetworkId?: CoingeckoNetworkID,
  params?: MapType<any>,
) => {
  const url = `${COINGECKO_API_URL}${endpoint}${
    coingeckoNetworkId || ''
  }${paramString(params)}`;
  return url;
};

export const getCoingeckoData = async (
  endpoint: CoingeckoApiEndpoint,
  coingeckoNetworkId?: CoingeckoNetworkID,
  params?: MapType<any>,
  retryCount?: number,
): Promise<any> => {
  try {
    const url = createUrl(endpoint, coingeckoNetworkId, params);
    const rsp = await axios.get(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return rsp.data;
  } catch (err: any) {
    logger.warn(`getCoingeckoData error: ${err.message}`);
    if (
      !retryCount ||
      retryCount < configDefaults.tokenPrices.priceLookupRetries
    ) {
      logger.log('Retrying getCoingeckoData request...');
      return getCoingeckoData(
        endpoint,
        coingeckoNetworkId,
        params,
        retryCount ? retryCount + 1 : 1,
      );
    }
    throw new Error(err);
  }
};
