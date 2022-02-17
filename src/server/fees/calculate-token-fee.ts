import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { NetworkFeeSettings } from '../../models/network-models';
import { GasTokenConfig, Token } from '../../models/token-models';
import {
  allTokenAddressesForNetwork,
  getTransactionTokens,
} from '../tokens/network-tokens';
import {
  getTransactionTokenPrices,
  TokenPrice,
} from '../tokens/token-price-cache';
import { deserializePopulatedTransaction } from '../transactions/populated-transaction';
import { estimateMaximumGas } from './gas-estimate';
import { cacheFeeForTransaction } from './transaction-fee-cache';

export const getAllUnitTokenFeesForChain = (
  chainID: NetworkChainID,
): MapType<string> => {
  const tokenAddresses = allTokenAddressesForNetwork(chainID);
  const tokenFeesForChain: MapType<string> = {};
  tokenAddresses.forEach((tokenAddress) => {
    try {
      tokenFeesForChain[tokenAddress] = calculateTokenFeePerUnitGasToken(
        chainID,
        tokenAddress,
      ).toHexString();
    } catch (err: any) {
      // No op.
    }
  });
  return tokenFeesForChain;
};

export const calculateTokenFeePerUnitGasToken = (
  chainID: NetworkChainID,
  tokenAddress: string,
) => {
  const precision = configDefaults.transactionFeePrecision;
  const { roundedPriceRatio, decimalRatio } = getTokenRatiosFromCachedPrices(
    chainID,
    tokenAddress,
    precision,
  );

  const networkConfig = configNetworks[chainID];
  const { gasToken } = networkConfig;
  const oneUnitGas = BigNumber.from(10).pow(BigNumber.from(gasToken.decimals));

  const tokenFee = getTokenFee(
    oneUnitGas,
    roundedPriceRatio,
    decimalRatio,
    precision,
  );
  return tokenFee;
};

export const calculateTokenFeeForTransaction = async (
  chainID: NetworkChainID,
  serializedTransaction: string,
  tokenAddress: string,
): Promise<BigNumber> => {
  const precision = configDefaults.transactionFeePrecision;
  const { roundedPriceRatio, decimalRatio } = getTokenRatiosFromCachedPrices(
    chainID,
    tokenAddress,
    precision,
  );

  const populatedTransaction = deserializePopulatedTransaction(
    serializedTransaction,
  );
  const maximumGas = await estimateMaximumGas(chainID, populatedTransaction);
  const maximumGasFeeForToken = getTokenFee(
    maximumGas,
    roundedPriceRatio,
    decimalRatio,
    precision,
  );

  cacheFeeForTransaction(
    serializedTransaction,
    tokenAddress,
    maximumGasFeeForToken,
  );

  return BigNumber.from(maximumGasFeeForToken);
};

const getTokenFee = (
  gas: BigNumber,
  roundedPriceRatio: BigNumber,
  decimalRatio: BigNumber,
  precision: number,
) => {
  return gas
    .mul(roundedPriceRatio)
    .div(decimalRatio)
    .div(BigNumber.from(precision));
};

const getTokenRatiosFromCachedPrices = (
  chainID: NetworkChainID,
  tokenAddress: string,
  precision: number,
) => {
  const networkConfig = configNetworks[chainID];
  const { token, gasToken } = getTransactionTokens(chainID, tokenAddress);
  const { tokenPrice, gasTokenPrice } = getTransactionTokenPrices(
    chainID,
    token,
    gasToken,
  );

  const roundedPriceRatio = getRoundedTokenToGasPriceRatio(
    tokenPrice,
    gasTokenPrice,
    networkConfig.fees,
    precision,
  );
  const decimalRatio = getTransactionTokenToGasDecimalRatio(token, gasToken);

  return { roundedPriceRatio, decimalRatio };
};

export const getRoundedTokenToGasPriceRatio = (
  tokenPrice: TokenPrice,
  gasTokenPrice: TokenPrice,
  fees: NetworkFeeSettings,
  precision: number,
): BigNumber => {
  const priceRatio = gasTokenPrice.price / tokenPrice.price;
  const slippage = priceRatio * fees.slippageBuffer;
  const profit = priceRatio * fees.slippageBuffer;
  const totalFeeRatio = priceRatio + slippage + profit;
  const ratioMinimum = configDefaults.transactionFeeRatioMinimum;

  const ratio = totalFeeRatio * precision;
  if (ratio < ratioMinimum) {
    throw new Error(
      `Price ratio between token (${tokenPrice.price}) and gas token (${gasTokenPrice.price})
      is not precise enough to provide an accurate fee.`,
    );
  }

  const roundedPriceRatio = BigNumber.from(Math.round(ratio));
  return roundedPriceRatio;
};

export const getTransactionTokenToGasDecimalRatio = (
  token: Token,
  gasToken: GasTokenConfig,
): BigNumber => {
  const decimalDifference = gasToken.decimals - token.decimals;
  return BigNumber.from(10).pow(BigNumber.from(decimalDifference));
};
