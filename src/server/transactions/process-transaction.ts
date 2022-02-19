import { TransactionResponse } from '@ethersproject/providers';
import { NetworkChainID } from '../config/config-chain-ids';
import { createTransactionGasDetails } from '../fees/calculate-transaction-gas';
import { validateFee } from '../fees/fee-validator';
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

  const { tokenAddress, packagedFeeAmount } = extractPackagedFeeFromTransaction(
    chainID,
    populatedTransaction,
  );
  await validateFee(
    chainID,
    tokenAddress,
    populatedTransaction,
    feeCacheID,
    packagedFeeAmount,
  );

  const gasDetails = await createTransactionGasDetails(
    chainID,
    populatedTransaction,
    tokenAddress,
    packagedFeeAmount,
  );

  return executeTransaction(chainID, populatedTransaction, gasDetails);
};
