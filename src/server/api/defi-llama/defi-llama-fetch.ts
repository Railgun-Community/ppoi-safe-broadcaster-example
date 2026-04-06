import axios from 'axios';
import { BroadcasterChain } from '../../../models/chain-models';
import { NetworkChainID } from '../../config/config-chains';
import { ChainType, isDefined } from '@railgun-community/shared-models';

const DEFI_LLAMA_PRICE_API = 'https://coins.llama.fi/prices/current';

export type DefiLlamaPriceResponse = {
  coins: {
    [key: string]: {
      price: number;
      symbol: string;
      timestamp: number;
      confidence: number;
    };
  };
};

export const getDefiLlamaChainName = (chain: BroadcasterChain): string | undefined => {
  if (chain.type !== ChainType.EVM) {
    return undefined;
  }
  switch (chain.id) {
    case NetworkChainID.Ethereum:
      return 'ethereum';
    case NetworkChainID.BNBChain:
      return 'bsc';
    case NetworkChainID.PolygonPOS:
      return 'polygon';
    case NetworkChainID.Arbitrum:
      return 'arbitrum';
    // Testnets and others might not be supported directly or use different IDs
    default:
      return undefined;
  }
};

export const fetchDefiLlamaPrices = async (
  chain: BroadcasterChain,
  tokenAddresses: string[],
): Promise<DefiLlamaPriceResponse> => {
  const chainName = getDefiLlamaChainName(chain);
  if (!isDefined(chainName)) {
    return { coins: {} };
  }

  const coins = tokenAddresses
    .map((address) => `${chainName}:${address}`)
    .join(',');

  const url = `${DEFI_LLAMA_PRICE_API}/${coins}`;
  try {
    const response = await axios.get<DefiLlamaPriceResponse>(url);
    return response.data;
  } catch (error) {
    return { coins: {} };
  }
};
