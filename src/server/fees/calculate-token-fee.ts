import { BigNumber } from '@ethersproject/bignumber';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { GAS_TOKEN_DECIMALS, Token } from '../../models/token-models';
import {
  allTokenAddressesForNetwork,
  getTransactionTokens,
} from '../tokens/network-tokens';
import { getTransactionTokenPrices } from '../tokens/token-price-cache';
import { cacheUnitFeesForTokens } from './transaction-fee-cache';
import { RelayerChain } from '../../models/chain-models';
import { FeeConfig } from '../../models/fee-config';

export const getAllUnitTokenFeesForChain = (
  chain: RelayerChain,
): { fees: MapType<BigNumber>; feeCacheID: string } => {
  const tokenAddresses = allTokenAddressesForNetwork(chain);
  const tokenFeesForChain: MapType<BigNumber> = {};
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

export const calculateTokenFeePerUnitGasToken = (
  chain: RelayerChain,
  tokenAddress: string,
) => {
  const oneUnitGas = BigNumber.from(10).pow(BigNumber.from(GAS_TOKEN_DECIMALS));
  return getTokenFee(chain, oneUnitGas, tokenAddress);
};

export const getTokenFee = (
  chain: RelayerChain,
  maximumGas: BigNumber,
  tokenAddress: string,
) => {
  const { precision } = configDefaults.transactionFees;
  const { roundedPriceRatio, decimalRatio } = getTokenRatiosFromCachedPrices(
    chain,
    tokenAddress,
    precision,
  );
  return maximumGas
    .mul(roundedPriceRatio)
    .div(decimalRatio)
    .div(BigNumber.from(precision));
};

const getTokenRatiosFromCachedPrices = (
  chain: RelayerChain,
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
): BigNumber => {
  const priceRatio = gasTokenPrice / tokenPrice;

  // Adjust price ratio to account for difference between gas limit and actual gas cost.
  const adjustedPriceRatio = priceRatio / fees.gasEstimateLimitToActualRatio;

  const gasEstimateVariance =
    adjustedPriceRatio * fees.gasEstimateVarianceBuffer;
  const profit = adjustedPriceRatio * fees.profit;
  const totalFeeRatio = adjustedPriceRatio + gasEstimateVariance + profit;
  const ratioMinimum = configDefaults.transactionFees.priceRatioMinimum;

  const ratio = totalFeeRatio * precision;
  if (ratio < ratioMinimum) {
    throw new Error(
      `Price ratio between token (${tokenPrice}) and gas token (${gasTokenPrice})
      is not precise enough to provide an accurate fee.`,
    );
  }

  const roundedPriceRatio = BigNumber.from(Math.round(ratio));
  return roundedPriceRatio;
};

export const getTransactionTokenToGasDecimalRatio = (
  token: Token,
): BigNumber => {
  const decimalDifference = GAS_TOKEN_DECIMALS - token.decimals;
  return BigNumber.from(10).pow(BigNumber.from(decimalDifference));
};
