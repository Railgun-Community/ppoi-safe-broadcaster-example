import axios from 'axios';
import { BroadcasterChain } from '../../../models/chain-models';
import {
  UniswapProtocolType,
  UniswapQuoteInputs,
  UniswapQuoteParams,
  UniswapQuoteResponse,
} from './uniswap-models';

export const getUniswapURL = () => {
  return 'https://api.uniswap.org';
};

export const getUniswapQuoteURL = () => {
  return `${getUniswapURL()}/v2/quote`;
};

export const getUniswapHeaders = () => {
  return {
    headers: {
      accept: '*/*',
      origin: getUniswapURL(),
      'content-type': 'application/json',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  };
};

export const getUniswapQuoteParams = (
  chain: BroadcasterChain,
  recipientAddress: string,
  quoteInputs: UniswapQuoteInputs,
): UniswapQuoteParams => {
  const {
    slippage,
    tokenInAmount,
    tokenInAddress: tokenIn,
    tokenOutAddress: tokenOut,
  } = quoteInputs;

  return {
    tokenInChainId: chain.id,
    tokenIn,
    tokenOutChainId: chain.id,
    tokenOut,
    amount: tokenInAmount,
    slippage,
    sendPortionEnabled: true,
    type: 'EXACT_INPUT',
    configs: [
      {
        protocols: [
          UniswapProtocolType.V2,
          UniswapProtocolType.V3,
          UniswapProtocolType.MIXED,
        ],
        enableUniversalRouter: true,
        routingType: 'CLASSIC',
        recipient: recipientAddress,
        enableFeeOnTransferFeeFetching: true,
      },
    ],
  };
};

export const fetchUniswapQuote = async <T>(
  quoteParams: UniswapQuoteParams,
): Promise<T | undefined> => {
  try {
    const response = await axios.post(
      getUniswapQuoteURL(),
      quoteParams,
      getUniswapHeaders(),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const { data } = response;
    return data;
  } catch (error) {
    return undefined;
  }
};
