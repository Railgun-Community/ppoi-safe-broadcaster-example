import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { GAS_TOKEN_DECIMALS, Token } from '../../models/token-models';
import {
  allTokenAddressesForNetwork,
  getTransactionTokens,
} from '../tokens/network-tokens';
import { getTransactionTokenPrices } from '../tokens/token-price-cache';
import { cacheUnitFeesForTokens } from './transaction-fee-cache';
import { BroadcasterChain } from '../../models/chain-models';
import { FeeConfig } from '../../models/fee-config';

export const getAllUnitTokenFeesForChain = (
  chain: BroadcasterChain,
): { fees: MapType<bigint>; feeCacheID: string } => {
  const tokenAddresses = allTokenAddressesForNetwork(chain);
  const tokenFeesForChain: MapType<bigint> = {};
  tokenAddresses.forEach((tokenAddress) => {
    try {
      tokenFeesForChain[tokenAddress] = calculateTokenFeePerUnitGasToken(
        chain,
        tokenAddress,
      );
    } catch (err) {
      // No op.
    }
  });
  const feeCacheID = cacheUnitFeesForTokens(chain, tokenFeesForChain);
  return { fees: tokenFeesForChain, feeCacheID };
};

export const parseGasTokenFee = (fee: bigint, token: Token) => {
  return fee / 10n ** BigInt(token.decimals);

  // return fee.div(BigNumber.from(10).pow(BigNumber.from(token.decimals)));
};

export const convertCachedTokenFee = (
  cachedUnitTokenFee: bigint,
  maximumGas: bigint,
  token: Token,
) => {
  const decimalRatio = getTransactionTokenToGasDecimalRatio(token);
  const maximumGasConversion = (cachedUnitTokenFee * maximumGas) / decimalRatio;
  return parseGasTokenFee(maximumGasConversion, token);
};

export const calculateTokenFeePerUnitGasToken = (
  chain: BroadcasterChain,
  tokenAddress: string,
) => {
  const oneUnitGas = 10n ** BigInt(GAS_TOKEN_DECIMALS);
  return getTokenFee(chain, oneUnitGas, tokenAddress);
};

export const getTokenFee = (
  chain: BroadcasterChain,
  maximumGas: bigint,
  tokenAddress: string,
) => {
  const { precision } = configDefaults.transactionFees;
  const { roundedPriceRatio, decimalRatio } = getTokenRatiosFromCachedPrices(
    chain,
    tokenAddress,
    precision,
  );

  return (maximumGas * roundedPriceRatio) / decimalRatio / BigInt(precision);
};

export const getTokenPricesFromCachedPrices = (
  chain: BroadcasterChain,
  tokenAddress: string,
) => {
  const { token, gasToken } = getTransactionTokens(chain, tokenAddress);
  const { tokenPrice, gasTokenPrice } = getTransactionTokenPrices(
    chain,
    token,
    gasToken,
  );

  return {
    tokenPrice,
    gasTokenPrice,
  };
};

const getTokenRatiosFromCachedPrices = (
  chain: BroadcasterChain,
  tokenAddress: string,
  precision: number,
) => {
  const networkConfig = configNetworks[chain.type][chain.id];
  const { token, gasToken } = getTransactionTokens(chain, tokenAddress);
  const { tokenPrice, gasTokenPrice } = getTransactionTokenPrices(
    chain,
    token,
    gasToken,
  );

  const roundedPriceRatio = getRoundedTokenToGasPriceRatio(
    tokenPrice,
    gasTokenPrice,
    networkConfig.fees,
    precision,
  );
  const decimalRatio = getTransactionTokenToGasDecimalRatio(token);

  return { roundedPriceRatio, decimalRatio };
};

export const getRoundedTokenToGasPriceRatio = (
  tokenPrice: number,
  gasTokenPrice: number,
  fees: FeeConfig,
  precision: number,
): bigint => {
  const priceRatio = gasTokenPrice / tokenPrice;

  // Adjust price ratio to account for difference between gas limit and actual gas cost.
  const adjustedPriceRatio = priceRatio / fees.gasEstimateLimitToActualRatio;

  const profit = adjustedPriceRatio * fees.profit;
  const totalFeeRatio = adjustedPriceRatio + profit;
  const ratioMinimum = configDefaults.transactionFees.priceRatioMinimum;

  const ratio = totalFeeRatio * precision;
  if (ratio < ratioMinimum) {
    throw new Error(
      `Price ratio between token (${tokenPrice}) and gas token (${gasTokenPrice})
      is not precise enough to provide an accurate fee.`,
    );
  }

  const roundedPriceRatio = BigInt(Math.round(ratio));
  return roundedPriceRatio;
};

export const getTransactionTokenToGasDecimalRatio = (token: Token): bigint => {
  const decimalDifference = GAS_TOKEN_DECIMALS - token.decimals;
  return 10n ** BigInt(decimalDifference);
};
