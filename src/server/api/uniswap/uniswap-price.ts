import { ChainType, delay, isDefined, promiseTimeout } from "@railgun-community/shared-models";
import { RelayerChain } from "../../../models/chain-models";
import { NetworkChainID } from "../../config/config-chains";
import { tokenForAddress } from "../../tokens/network-tokens";
import { UniswapQuoteInputs, UniswapQuoteResponse } from "./uniswap-models";
import { fetchUniswapQuote, getUniswapQuoteParams } from "./uniswap-fetch";
import { TokenPrice, TokenPriceUpdater } from "../../tokens/token-price-cache";
import debug from 'debug';

const dbg = debug('relayer:UniswapPrice');
const UNISWAP_PRICE_LOOKUP_DELAY = 1500;
type UniswapFormattedPriceData = {
  price: number;
};
const refreshLocks: NumMapType<NumMapType<boolean>> = {};


export const getStablecoinReferenceSymbols = (chain: RelayerChain): string[] => {
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
          return ['DAI'];
        case NetworkChainID.Arbitrum:
        case NetworkChainID.ArbitrumGoerli:
          return ['USDT'];
        case NetworkChainID.Hardhat:
        case NetworkChainID.PolygonAmoy:
          throw error;
      }
    }
  }
};



export const uniswapPriceLookupByAddress = async (
  chain: RelayerChain,
  tokenAddress: string,
): Promise<Optional<UniswapFormattedPriceData>> => {
  try {
    const { decimals, symbol } = tokenForAddress(chain, tokenAddress);
    // TODO: This depends on DAI being stable at $1.
    // As we've seen, this isn't the safest methodology.
    // However, if the price of DAI drops, the broadcasted fees can only increase,
    // so for this use case, it is not harmful.

    const stablecoinSymbol = getStablecoinReferenceSymbols(chain);
    if (stablecoinSymbol.includes(symbol) === true) {
      return { price: 1 };
    }
    const sellAmount = (10n ** decimals).toString(10);
    const params: UniswapQuoteInputs = {
      tokenInAddress: tokenAddress,
      tokenOutAddress: stablecoinSymbol[0],
      tokenInAmount: sellAmount, // 1 token
      slippage: 0.5
    };

    const quoteParams = getUniswapQuoteParams(
      chain,
      "0x000000000000000000000000000000000000dead",
      params);

    const quoteResponse = await fetchUniswapQuote<UniswapQuoteResponse>(quoteParams);

    if (isDefined(quoteResponse)) {
      const { quote } = quoteResponse;
      return {
        price: parseFloat(quote.quoteDecimals),
      };
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
};


export const uniswapUpdatePricesByAddresses = async (
  chain: RelayerChain,
  tokenAddresses: string[],
  updater: TokenPriceUpdater,
): Promise<void> => {
  refreshLocks[chain.type] ??= {};
  if (refreshLocks[chain.type][chain.id]) {
    return;
  }
  refreshLocks[chain.type][chain.id] = true;
  dbg(`Starting chain ${chain.type}:${chain.id}`);

  for (const tokenAddress of tokenAddresses) {
    // eslint-disable-next-line no-await-in-loop
    await promiseTimeout(
      uniswapPriceLookupByAddress(chain, tokenAddress),
      10 * 1000,
    )
      .then((uniswapPriceData: any) => {
        if (isDefined(uniswapPriceData)) {
          const tokenPrice: TokenPrice = {
            price: uniswapPriceData.price,
            updatedAt: Date.now(),
          };
          updater(tokenAddress, tokenPrice);
        }
      })
      .catch((err: Error) => {
        if (isDefined(err) && err.message.includes('Timed out')) {
          dbg(
            `Token ${tokenAddress} timed out on chain ${chain.type}:${chain.id}`,
          );
        }
      });

    // eslint-disable-next-line no-await-in-loop
    await delay(UNISWAP_PRICE_LOOKUP_DELAY);
  }
  dbg(`Ended chain ${chain.type}:${chain.id}`);
  await delay(UNISWAP_PRICE_LOOKUP_DELAY);

  refreshLocks[chain.type][chain.id] = false;
};
