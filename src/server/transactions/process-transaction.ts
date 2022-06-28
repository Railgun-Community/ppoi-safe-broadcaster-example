import {
  TransactionRequest,
  TransactionResponse,
} from '@ethersproject/providers';
import debug from 'debug';
import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { createTransactionGasDetails } from '../fees/calculate-transaction-gas';
import { validateFee } from '../fees/fee-validator';
import {
  getEstimateGasDetails,
  calculateMaximumGas,
} from '../fees/gas-estimate';
import { getBestMatchWalletForNetwork } from '../wallets/best-match-wallet';
import { executeTransaction } from './execute-transaction';
import { extractPackagedFeeFromTransaction } from './extract-packaged-fee';
import { deserializeTransaction } from './transaction-deserializer';

const dbg = debug('relayer:transact:validate');

export const processTransaction = async (
  chainID: NetworkChainID,
  feeCacheID: string,
  serializedTransaction: string,
  useRelayAdapt: boolean,
  devLog?: boolean,
): Promise<TransactionResponse> => {
  const transactionRequest = deserializeTransaction(serializedTransaction);

  // Minimum gas for gas estimate wallet: 0.1.
  const minimumGasNeeded = BigNumber.from(10).pow(17);

  const walletForGasEstimate = await getBestMatchWalletForNetwork(
    chainID,
    minimumGasNeeded,
  );

  delete transactionRequest.gasLimit;
  delete transactionRequest.gasPrice;
  delete transactionRequest.maxFeePerGas;
  delete transactionRequest.maxPriorityFeePerGas;
  const transactionRequestForGasEstimate: TransactionRequest = {
    ...transactionRequest,
    from: walletForGasEstimate.address,
  };

  const gasEstimateDetails = await getEstimateGasDetails(
    chainID,
    transactionRequestForGasEstimate,
    devLog,
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
