import { BigNumber } from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { EVMGasType } from '../../models/network-models';
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
  chain: RelayerChain,
  gasEstimateDetails: TransactionGasDetails,
  tokenAddress: string,
  tokenFee: BigNumber,
): TransactionGasDetails => {
  const { evmGasType, gasEstimate } = gasEstimateDetails;
  const gasLimit = calculateGasLimit(gasEstimate);
  const { token, gasToken } = getTransactionTokens(chain, tokenAddress);
  const { tokenPrice, gasTokenPrice } = getTransactionTokenPrices(
    chain,
    token,
    gasToken,
  );

  const networkConfig = configNetworks[chain.type][chain.id];
  const { precision } = configDefaults.transactionFees;
  const roundedRatio = getRoundedTokenToGasPriceRatio(
    tokenPrice,
    gasTokenPrice,
    networkConfig.fees,
    precision,
  );
  const decimalRatio = getTransactionTokenToGasDecimalRatio(token);

  // This is the inverse of the fee calculation in calculate-token-fee.ts.
  const translatedTotalGas = tokenFee
    .mul(BigNumber.from(precision))
    .mul(decimalRatio)
    .div(roundedRatio);

  const translatedGasPrice = translatedTotalGas.div(gasLimit);

  switch (evmGasType) {
    case EVMGasType.Type0: {
      return {
        evmGasType,
        gasEstimate,
        gasPrice: translatedGasPrice,
      };
    }
    case EVMGasType.Type2: {
      const { maxPriorityFeePerGas } = gasEstimateDetails;
      const maxFeePerGas = translatedGasPrice;
      if (maxFeePerGas.isNegative()) {
        throw new Error('Max fee cannot be negative.');
      }
      return {
        evmGasType,
        gasEstimate,
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    }
  }

  throw new Error('Unrecognized gas type.');
};
