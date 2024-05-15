import {
  TransactionGasDetails,
  EVMGasType,
} from '@railgun-community/shared-models';
import { BroadcasterChain } from '../../../models/chain-models';
import configDefaults from '../../config/config-defaults';
import configNetworks from '../../config/config-networks';
import { getTransactionTokens } from '../../tokens/network-tokens';
import { getTransactionTokenPrices } from '../../tokens/token-price-cache';
import {
  getRoundedTokenToGasPriceRatio,
  getTransactionTokenToGasDecimalRatio,
} from '../calculate-token-fee';
import { calculateGasLimitBroadcaster } from '../gas-estimate';

/**
 * This is a legacy operation, now that we have minGasPrice in every Relayed transaction.
 * Retaining the code for posterity.
 */
export const createTransactionGasDetailsLegacy = (
  chain: BroadcasterChain,
  gasEstimateDetails: TransactionGasDetails,
  tokenAddress: string,
  tokenFee: bigint,
): TransactionGasDetails => {
  const { evmGasType, gasEstimate } = gasEstimateDetails;
  const gasLimit = calculateGasLimitBroadcaster(gasEstimate, chain);
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
  const translatedTotalGas =
    (tokenFee * BigInt(precision) * decimalRatio) / roundedRatio;

  const translatedGasPrice = translatedTotalGas / gasLimit;

  switch (evmGasType) {
    case EVMGasType.Type0:
    case EVMGasType.Type1: {
      return {
        evmGasType,
        gasEstimate,
        gasPrice: translatedGasPrice,
      };
    }
    case EVMGasType.Type2: {
      const { maxPriorityFeePerGas } = gasEstimateDetails;
      const maxFeePerGas = translatedGasPrice;
      if (maxFeePerGas < 0n) {
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
