import axios from 'axios';
import { logger } from '../../../util/logger';
import { NetworkChainID } from '../../config/config-chain-ids';

export enum ZeroXApiEndpoint {
  PriceLookup = 'swap/v1/price',
}

const zeroXApiUrl = (chainID: NetworkChainID): string => {
  switch (chainID) {
    case NetworkChainID.Ethereum:
      return 'https://api.0x.org/';
    case NetworkChainID.Ropsten:
      return 'https://ropsten.api.0x.org/';
    case NetworkChainID.BNBSmartChain:
      return 'https://bsc.api.0x.org/';
    case NetworkChainID.PolygonPOS:
      return 'https://polygon.api.0x.org/';
  }

  throw new Error(`No 0x API URL for chain ${chainID}`);
};

const paramString = (params?: MapType<any>) => {
  if (!params) {
    return '';
  }
  const searchParams = new URLSearchParams(params);
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

const createUrl = (
  endpoint: ZeroXApiEndpoint,
  chainID: NetworkChainID,
  params?: MapType<any>,
) => {
  const url = `${zeroXApiUrl(chainID)}${endpoint}${paramString(params)}`;
  return url;
};

export const getZeroXData = async <T>(
  endpoint: ZeroXApiEndpoint,
  chainID: NetworkChainID,
  params?: MapType<any>,
): Promise<T> => {
  const url = createUrl(endpoint, chainID, params);
  try {
    const rsp = await axios.get(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return rsp.data;
  } catch (err) {
    logger.warn(`zeroXPriceLookupByAddress error for ${url} - ${err.message}`);
    throw err;
  }
};
