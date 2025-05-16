import { ChainType } from '@railgun-community/shared-models';
import axios from 'axios';
import { BroadcasterChain } from '../../../models/chain-models';
import { logger } from '../../../util/logger';
import { NetworkChainID } from '../../config/config-chains';
import configDefaults from '../../config/config-defaults';

export enum ZeroXApiEndpoint {
  PriceLookup = 'swap/permit2/price',
  GetSwapQuote = 'swap/allowance-holder/quote',
}

export const getStablecoinReferenceSymbol = (
  chain: BroadcasterChain,
): string => {
  const error = new Error(
    `Chain ${chain.type}:${chain.id} has no reference symbol, Unable to get price quotes.`,
  );

  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Ethereum:
        case NetworkChainID.EthereumGoerli:
        case NetworkChainID.EthereumSepolia:
        case NetworkChainID.BNBChain:
        case NetworkChainID.PolygonPOS:
        case NetworkChainID.PolygonMumbai:
          return 'DAI';
        case NetworkChainID.Arbitrum:
        case NetworkChainID.ArbitrumGoerli:
          return 'USDT';
        case NetworkChainID.Hardhat:
        case NetworkChainID.PolygonAmoy:
          throw error;
      }
    }
  }
  throw error;
};

const zeroXApiUrl = (chain: BroadcasterChain): string => {
  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Ethereum:
        case NetworkChainID.BNBChain:
        case NetworkChainID.PolygonPOS:
        case NetworkChainID.Arbitrum:
        case NetworkChainID.PolygonMumbai:
        case NetworkChainID.EthereumSepolia:
          return 'https://api.0x.org/';
        case NetworkChainID.EthereumGoerli:
        case NetworkChainID.ArbitrumGoerli:
        case NetworkChainID.PolygonAmoy:
        case NetworkChainID.Hardhat:
          throw new Error(`No 0x API URL for chain ${chain.type}:${chain.id}`);
      }
    }
  }
};

export const zeroXSupportsNetwork = (chain: BroadcasterChain): boolean => {
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
  chain: BroadcasterChain,
  params?: MapType<any>,
) => {
  const url = `${zeroXApiUrl(chain)}${endpoint}${paramString(params)}`;
  return url;
};

export const getZeroXData = async <T>(
  endpoint: ZeroXApiEndpoint,
  chain: BroadcasterChain,
  params?: MapType<any>,
): Promise<T> => {
  const url = createUrl(endpoint, chain, params);
  const apiKey = configDefaults.api.zeroXApiKey;
  if (!apiKey) {
    throw new Error('Requires 0x API Key for prices/quotes.');
  }
  try {
    const rsp = await axios.get(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        '0x-api-key': apiKey,
        '0x-version': 'v2'
      },
    });
    return rsp.data;
  } catch (err) {
    logger.warn(`zeroXPriceLookupByAddress error for ${url} - ${err.message}`);
    throw err;
  }
};
