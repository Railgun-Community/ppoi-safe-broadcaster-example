import { ChainType } from '@railgun-community/engine';
import axios from 'axios';
import { RelayerChain } from '../../../models/chain-models';
import { logger } from '../../../util/logger';
import { NetworkChainID } from '../../config/config-chains';

export enum ZeroXApiEndpoint {
  PriceLookup = 'swap/v1/price',
  GetSwapQuote = 'swap/v1/quote',
}

const zeroXApiUrl = (chain: RelayerChain): string => {
  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Ethereum:
          return 'https://api.0x.org/';
        case NetworkChainID.EthereumGoerli:
          return 'https://goerli.api.0x.org/';
        case NetworkChainID.BNBChain:
          return 'https://bsc.api.0x.org/';
        case NetworkChainID.PolygonPOS:
          return 'https://polygon.api.0x.org/';
        case NetworkChainID.PolygonMumbai:
          return 'https://mumbai.api.0x.org/';
        case NetworkChainID.Hardhat:
          throw new Error(`No 0x API URL for chain ${chain}`);
      }
    }
  }
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
  chain: RelayerChain,
  params?: MapType<any>,
) => {
  const url = `${zeroXApiUrl(chain)}${endpoint}${paramString(params)}`;
  return url;
};

export const getZeroXData = async <T>(
  endpoint: ZeroXApiEndpoint,
  chain: RelayerChain,
  params?: MapType<any>,
): Promise<T> => {
  const url = createUrl(endpoint, chain, params);
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
