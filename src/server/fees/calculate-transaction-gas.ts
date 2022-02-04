import { BigNumber, PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { getTransactionTokens } from '../tokens/network-tokens';
import { getTransactionTokenPrices } from '../tokens/token-price-cache';
import {
  getRoundedTokenToGasPriceRatio,
  getTransactionTokenToGasDecimalRatio,
} from './calculate-token-fee';
import { calculateGasLimit, getGasDetails } from './gas-estimate';

export type TransactionGasDetails = {
  gasLimit: BigNumber;
  gasPrice: BigNumber;
};

export const createTransactionGasDetails = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
  tokenAddress: string,
  tokenFee: BigNumber,
): Promise<TransactionGasDetails> => {
  const { gasEstimate, gasPrice: gasPriceEstimate } = await getGasDetails(
    chainID,
    populatedTransaction,
  );
  const gasLimit = calculateGasLimit(gasEstimate);

  const { token, gasToken } = getTransactionTokens(chainID, tokenAddress);
  const { tokenPrice, gasTokenPrice } = getTransactionTokenPrices(
    chainID,
    token,
    gasToken,
  );

  const networkConfig = configNetworks[chainID];
  const precision = configDefaults.transactionFeePrecision;
  const roundedRatio = getRoundedTokenToGasPriceRatio(
    tokenPrice,
    gasTokenPrice,
    networkConfig.fees,
    precision,
  );
  const decimalRatio = getTransactionTokenToGasDecimalRatio(token, gasToken);

  // This is the inverse of the fee calculation in calculate-token-fee.ts.
  const translatedTotalGas = tokenFee
    .mul(BigNumber.from(precision))
    .mul(decimalRatio)
    .div(roundedRatio);

  const translatedGasPrice = translatedTotalGas.div(gasLimit);

  // TODO: Add a stronger mechanism for predicting low gas price.
  // If translated gas price is >5% lower than the estimated gas price, error out.
  if (translatedGasPrice.lt(gasPriceEstimate.mul(95).div(100))) {
    throw new Error(
      `Gas price too low (${translatedGasPrice.toString()} vs ${gasPriceEstimate.toString()}). Please refresh your token transaction fee and try again.`,
    );
  }

  return {
    gasLimit: gasLimit,
    gasPrice: translatedGasPrice,
  };
};
