import { ChainType } from '@railgun-community/engine';
import axios from 'axios';
import { RelayerChain } from '../../../models/chain-models';
import { logger } from '../../../util/logger';
import { NetworkChainID } from '../../config/config-chains';

export enum ZeroXApiEndpoint {
  PriceLookup = 'swap/v1/price',
  GetSwapQuote = 'swap/v1/quote',
}

export const getStablecoinReferenceSymbol = (
  chain: RelayerChain,
): string =>{

  const error = new Error(`Chain ${chain} has no reference symbol, Unable to get price quotes.`);

  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Ethereum:
        case NetworkChainID.EthereumGoerli:
        case NetworkChainID.BNBChain:
        case NetworkChainID.PolygonPOS:
        case NetworkChainID.PolygonMumbai:
          return 'DAI';
        case NetworkChainID.Arbitrum:
        case NetworkChainID.ArbitrumGoerli:
          return 'USDT';
        case NetworkChainID.Hardhat:
          throw error;
      }
    }
  }
  throw error;
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
        case NetworkChainID.Arbitrum:
          return 'https://arbitrum.api.0x.org/';
        case NetworkChainID.PolygonMumbai:
          return 'https://mumbai.api.0x.org/';
        case NetworkChainID.ArbitrumGoerli:
        case NetworkChainID.Hardhat:
          throw new Error(`No 0x API URL for chain ${chain}`);
      }
    }
  }
};

export const zeroXSupportsNetwork = (chain: RelayerChain): boolean => {
  try {
    zeroXApiUrl(chain);
    return true;
  } catch {
    return false;
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
