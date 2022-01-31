import { TransactionResponse } from '@ethersproject/providers';
import { BigNumber, PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import { createTransactionGasDetails } from '../fees/calculate-transaction-gas';
import { validateFee } from '../fees/fee-validator';
import { executeTransaction } from './execute-transaction';
import { deserializePopulatedTransaction } from './populated-transaction';

const extractFeeFromTransaction = (
  populatedTransaction: PopulatedTransaction,
): BigNumber => {
  // TODO. Extract fee from the transaction / proof, sent to Railgun address (fee receiver).
  return BigNumber.from(1);
};

export const processTransaction = async (
  chainID: NetworkChainID,
  serializedTransaction: string,
  tokenAddress: string,
): Promise<TransactionResponse> => {
  const populatedTransaction = deserializePopulatedTransaction(
    serializedTransaction,
  );

  const packagedFee = extractFeeFromTransaction(populatedTransaction);
  await validateFee(chainID, serializedTransaction, tokenAddress, packagedFee);

  const gasDetails = await createTransactionGasDetails(
    chainID,
    populatedTransaction,
    packagedFee,
    tokenAddress,
  );

  return executeTransaction(chainID, populatedTransaction, gasDetails);
};
