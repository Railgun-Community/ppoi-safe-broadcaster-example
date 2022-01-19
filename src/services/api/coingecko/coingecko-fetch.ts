import axios from 'axios';
import configDefaults from '../../../config/config-defaults';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/';

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

  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

const createUrl = (
  endpoint: CoingeckoApiEndpoint,
  endpointParam?: string,
  params?: MapType<any>,
) => {
  const url = `${COINGECKO_API_URL}${endpoint}${
    endpointParam || ''
  }${paramString(params)}`;
  return url;
};

export const getCoingeckoData = async (
  endpoint: CoingeckoApiEndpoint,
  endpointParam?: string,
  params?: MapType<any>,
  retryCount?: number,
): Promise<any> => {
  try {
    const url = createUrl(endpoint, endpointParam, params);
    const rsp = await axios.get(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return rsp.data;
  } catch (error: any) {
    console.error(`getCoingeckoData error: ${error.message}`);
    if (
      !retryCount ||
      retryCount < configDefaults.numRetriesCoingeckoPriceLookup
    ) {
      console.log('Retrying getCoingeckoData request...');
      return getCoingeckoData(
        endpoint,
        endpointParam,
        params,
        retryCount ? retryCount + 1 : 1,
      );
    }
    throw new Error(error);
  }
};
