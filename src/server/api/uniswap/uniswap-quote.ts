import { isDefined } from '@railgun-community/shared-models';
import { BroadcasterChain } from '../../../models/chain-models';
import { ERC20Amount } from '../../../models/token-models';
import { NetworkChainID } from '../../config/config-chains';
import { fetchUniswapQuote, getUniswapQuoteParams } from './uniswap-fetch';
import {
  UniswapQuoteData,
  UniswapQuoteInputs,
  UniswapQuoteResponse,
} from './uniswap-models';
import { AxiosError } from 'axios';

import debug from 'debug';

const dbg = debug('broadcaster:Uniswap-quote');

export const uniswapPermit2ContractAddress = (chain: BroadcasterChain) => {
  switch (chain.id) {
    case NetworkChainID.Ethereum:
    case NetworkChainID.BNBChain:
    case NetworkChainID.PolygonPOS:
    case NetworkChainID.Arbitrum: {
      return '0x000000000022d473030f116ddee9f6b43ac78ba3';
    }
    default: {
      throw new Error(
        `No Universal Router Contract address for chain ${chain.type}:${chain.id}`,
      );
    }
  }
};

const formatApiError = (err: AxiosError<any>): string => {
  dbg(err);
  return err.message ?? 'Uniswap Quote API request failed.';
};

export const uniswapGetSwapQuote = async (
  chain: BroadcasterChain,
  walletAddress: string,
  sellERC20Amount: ERC20Amount,
  buyTokenAddress: string,
  slippagePercentage: number,
): Promise<{ quote?: UniswapQuoteData; error?: string }> => {
  try {
    const sellAmount = sellERC20Amount.amount.toString();
    if (sellAmount === '0') {
      return {};
    }
    const sellTokenAddress = sellERC20Amount.tokenAddress;
    if (sellTokenAddress === buyTokenAddress) {
      return {};
    }
    const params: UniswapQuoteInputs = {
      tokenInAddress: sellERC20Amount.tokenAddress,
      tokenOutAddress: buyTokenAddress,
      tokenInAmount: sellAmount,
      slippage: slippagePercentage,
    };

    const quoteParams = getUniswapQuoteParams(chain, walletAddress, params);

    const quoteRaw = await fetchUniswapQuote<UniswapQuoteResponse>(quoteParams);
    if (!isDefined(quoteRaw)) {
      throw new Error('No quote returned from Uniswap');
    }
    const { routing, quote } = quoteRaw;

    if (routing !== 'CLASSIC') {
      throw new Error(`Invalid routing type: ${routing}`);
    }
    // implement security check here.

    return {
      quote,
    };
  } catch (err) {
    const msg = formatApiError(err);
    dbg(new Error(msg));
    return {
      error: `Uniswap Exchange Error: ${msg}`,
    };
  }
};
