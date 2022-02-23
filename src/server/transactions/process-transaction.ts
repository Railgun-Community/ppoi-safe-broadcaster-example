import { TransactionResponse } from '@ethersproject/providers';
import { NetworkChainID } from '../config/config-chain-ids';
import { createTransactionGasDetails } from '../fees/calculate-transaction-gas';
import { validateFee } from '../fees/fee-validator';
import { getEstimateGasDetails, getMaximumGas } from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { extractPackagedFeeFromTransaction } from './extract-packaged-fee';
import { deserializePopulatedTransaction } from './populated-transaction';

export const processTransaction = async (
  chainID: NetworkChainID,
  feeCacheID: string,
  serializedTransaction: string,
): Promise<TransactionResponse> => {
  const populatedTransaction = deserializePopulatedTransaction(
    serializedTransaction,
  );

  const gasEstimateDetails = await getEstimateGasDetails(
    chainID,
    populatedTransaction,
  );
  const maximumGas = getMaximumGas(gasEstimateDetails);

  const { tokenAddress, packagedFeeAmount } = extractPackagedFeeFromTransaction(
    chainID,
    populatedTransaction,
  );
  validateFee(chainID, tokenAddress, maximumGas, feeCacheID, packagedFeeAmount);

  const transactionGasDetails = createTransactionGasDetails(
    chainID,
    gasEstimateDetails.gasEstimate,
    tokenAddress,
    packagedFeeAmount,
  );

  return executeTransaction(
    chainID,
    populatedTransaction,
    transactionGasDetails,
  );
};
