import { TransactionResponse } from '@ethersproject/providers';
import debug from 'debug';
import { NetworkChainID } from '../config/config-chain-ids';
import { createTransactionGasDetails } from '../fees/calculate-transaction-gas';
import { validateFee } from '../fees/fee-validator';
import {
  getEstimateGasDetails,
  calculateMaximumGas,
} from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { extractPackagedFeeFromTransaction } from './extract-packaged-fee';
import { deserializeTransaction } from './transaction-deserializer';

const dbg = debug('relayer:transact:validate');

export const processTransaction = async (
  chainID: NetworkChainID,
  feeCacheID: string,
  serializedTransaction: string,
  useRelayAdapt: boolean,
): Promise<TransactionResponse> => {
  const transactionRequest = deserializeTransaction(serializedTransaction);

  delete transactionRequest.gasLimit;
  delete transactionRequest.gasPrice;
  delete transactionRequest.maxFeePerGas;
  delete transactionRequest.maxPriorityFeePerGas;

  const gasEstimateDetails = await getEstimateGasDetails(
    chainID,
    transactionRequest,
  );

  const maximumGas = calculateMaximumGas(gasEstimateDetails);
  dbg('Maximum gas:', maximumGas);

  const { tokenAddress, packagedFeeAmount } =
    await extractPackagedFeeFromTransaction(
      chainID,
      transactionRequest,
      useRelayAdapt,
    );
  validateFee(chainID, tokenAddress, maximumGas, feeCacheID, packagedFeeAmount);
  dbg('Fee validated:', packagedFeeAmount, tokenAddress);

  const transactionGasDetails = createTransactionGasDetails(
    chainID,
    gasEstimateDetails,
    tokenAddress,
    packagedFeeAmount,
  );
  dbg('Transaction gas details:', transactionGasDetails);

  return executeTransaction(chainID, transactionRequest, transactionGasDetails);
};
