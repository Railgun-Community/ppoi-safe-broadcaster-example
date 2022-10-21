import { BigNumber } from '@ethersproject/bignumber';
import { parseUnits } from '@ethersproject/units';
import { AxiosError } from 'axios';
import { ZeroXApiEndpoint, getZeroXData } from './0x-fetch';
import { TokenAmount } from '../../../models/token-models';
import { logger } from '../../../util/logger';
import { RelayerChain } from '../../../models/chain-models';
import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';

export const ZERO_X_PRICE_DECIMALS = 18;

export type ZeroXPriceData = {
  price: string;
  guaranteedPrice: string;
  buyAmount: string;
  allowanceTarget: string;
  to: string;
  data: string;
  value: string;
  sellTokenAddress: string;
  sellAmount: string;
};

export type ZeroXQuoteParams = {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  slippagePercentage: string;
};

export type ZeroXFormattedQuoteData = {
  price: BigNumber;
  guaranteedPrice: BigNumber;
  buyTokenAmount: TokenAmount;
  spender: string;
  to: string;
  data: string;
  value: string;
  slippagePercentage: number;
  sellTokenAddress: string;
  sellTokenValue: string;
};

export const zeroXExchangeProxyContractAddress = (chain: RelayerChain) => {
  const addresses = getContractAddressesForChainOrThrow(chain.id as number);
  return addresses.exchangeProxy;
};

// const validateZeroXDataField = (
//   provider: FallbackProvider,
//   to: string,
//   data: string,
//   value: string,
//   sellTokenAddress: string,
//   buyTokenAddress: string,
// ) => {
//   const contract = new Contract(to, ZERO_X_ABI, provider);
//   const parsedTransaction = contract.interface.parseTransaction({
//     data,
//     value,
//   });

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const argsString = JSON.stringify(parsedTransaction.args).toLowerCase();

//   if (
//     !argsString.includes(sellTokenAddress.toLowerCase()) ||
//     !argsString.includes(buyTokenAddress.toLowerCase())
//   ) {
//     throw new Error('Invalid sell amount: does not match 0x response.');
//   }
// };

const getZeroXQuoteInvalidError = (
  chain: RelayerChain,
  to: string,
  data: string,
  value: string,
  sellTokenAddress: string,
  buyTokenAddress: string,
): Optional<string> => {
  try {
    // Validate "to" address.
    const expectedAddress = zeroXExchangeProxyContractAddress(chain);
    if (to === expectedAddress) {
      // Validate "data" and "value" for 0x exchange.
      // TODO: Re-enable the below. Disabled because currently we pass 'ETH' in for sellTokenAddress or buyTokenAddress if it is a base token. And argsString that is produced within validateZeroXDataField returns 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for the base token
      // const provider = ProviderService.getProvider(networkName);
      // validateZeroXDataField(
      //   provider,
      //   to,
      //   data,
      //   value,
      //   sellTokenAddress,
      //   buyTokenAddress,
      // );
    } else if (to === sellTokenAddress || to === buyTokenAddress) {
      // Wrapped contract.
      // Do nothing.
    } else {
      throw new Error(`Invalid 0x Exchange contract address: ${to}`);
    }

    return undefined;
  } catch (err) {
    logger.error(err);
    return err.message;
  }
};

export const zeroXGetSwapQuote = async (
  chain: RelayerChain,
  sellTokenAmount: TokenAmount,
  buyTokenAddress: string,
  slippagePercentage: number,
): Promise<{ quote?: ZeroXFormattedQuoteData; error?: string }> => {
  try {
    const sellAmount = sellTokenAmount.amount.toString();
    if (sellAmount === '0') {
      return {};
    }
    const sellTokenAddress = sellTokenAmount.tokenAddress;
    if (sellTokenAddress === buyTokenAddress) {
      return {};
    }
    const params: ZeroXQuoteParams = {
      sellToken: sellTokenAmount.tokenAddress,
      buyToken: buyTokenAddress,
      sellAmount,
      slippagePercentage: String(slippagePercentage),
    };
    const {
      price,
      buyAmount,
      guaranteedPrice,
      allowanceTarget,
      to,
      data,
      value,
      sellTokenAddress: sellTokenAddressResponse,
      sellAmount: sellTokenValueResponse,
    } = await getZeroXData<ZeroXPriceData>(
      ZeroXApiEndpoint.GetSwapQuote,
      chain,
      params,
    );

    const invalidError = getZeroXQuoteInvalidError(
      chain,
      to,
      data,
      value,
      sellTokenAddress,
      buyTokenAddress,
    );
    if (invalidError) {
      return { error: invalidError };
    }

    return {
      quote: {
        price: parseUnits(price, ZERO_X_PRICE_DECIMALS),
        guaranteedPrice: parseUnits(guaranteedPrice, ZERO_X_PRICE_DECIMALS),
        buyTokenAmount: {
          tokenAddress: buyTokenAddress,
          amount: BigNumber.from(buyAmount),
        },
        spender: allowanceTarget,
        to,
        data,
        value,
        slippagePercentage,
        sellTokenAddress: sellTokenAddressResponse,
        sellTokenValue: sellTokenValueResponse,
      },
    };
  } catch (err) {
    const msg = formatApiError(err);
    logger.error(new Error(msg));
    return {
      error: `0x Exchange Error: ${msg}`,
    };
  }
};

const formatApiError = (err: AxiosError<any>): string => {
  // All come back as 400 with this format:
  // err.response.data.reason
  // err.response.data.validationErrors[].reason
  logger.error(err);

  try {
    if (
      err.response?.data?.validationErrors[0].reason ===
      'INSUFFICIENT_ASSET_LIQUIDITY'
    ) {
      return 'Insufficient liquidity. One of the selected tokens is not supported by the 0x Exchange.';
    }

    return `${err.response?.data.reason}: ${err.response?.data.validationErrors
      .map((e: any) => e.reason)
      .join(', ')}.`;
  } catch {
    return '0x API request failed.';
  }
};
