import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { getTransactionTokens } from '../tokens/network-tokens';
import { getTransactionTokenPrices } from '../tokens/token-price-cache';
import {
  getRoundedTokenToGasPriceRatio,
  getTransactionTokenToGasDecimalRatio,
} from './calculate-token-fee';
import { calculateGasLimit, TransactionGasDetails } from './gas-estimate';

export const createTransactionGasDetails = (
  chainID: NetworkChainID,
  gasEstimateDetails: TransactionGasDetails,
  tokenAddress: string,
  tokenFee: BigNumber,
): TransactionGasDetails => {
  const { maxPriorityFeePerGas, gasEstimate } = gasEstimateDetails;
  const gasLimit = calculateGasLimit(gasEstimate);
  const { token, gasToken } = getTransactionTokens(chainID, tokenAddress);
  const { tokenPrice, gasTokenPrice } = getTransactionTokenPrices(
    chainID,
    token,
    gasToken,
  );

  const networkConfig = configNetworks[chainID];
  const { precision } = configDefaults.transactionFees;
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
  const maxFeePerGas = translatedGasPrice.sub(maxPriorityFeePerGas);
  if (maxFeePerGas.isNegative()) {
    throw new Error('Max fee cannot be negative.');
  }

  return {
    gasEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
};
