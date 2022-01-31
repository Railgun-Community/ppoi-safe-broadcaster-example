import { TransactionResponse } from '@ethersproject/providers';
import { PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import { TransactionGasDetails } from '../fees/calculate-transaction-gas';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getBestWalletForNetwork } from '../wallets/active-wallets';

const setGasDetails = (
  populatedTransaction: PopulatedTransaction,
  gasDetails: TransactionGasDetails,
): PopulatedTransaction => {
  const txWithGas = populatedTransaction;
  txWithGas.gasLimit = gasDetails.gasLimit;
  txWithGas.gasPrice = gasDetails.gasPrice;
  return txWithGas;
};

export const executeTransaction = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
  gasDetails: TransactionGasDetails,
): Promise<TransactionResponse> => {
  const wallet = getBestWalletForNetwork(chainID);
  const txWithGas = setGasDetails(populatedTransaction, gasDetails);
  const signedTransaction = await wallet.signTransaction(txWithGas);
  const provider = getProviderForNetwork(chainID);
  const txResponse = await provider.sendTransaction(signedTransaction);
  return txResponse;
};
