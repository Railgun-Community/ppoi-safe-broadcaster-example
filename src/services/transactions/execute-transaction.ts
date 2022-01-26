import { TransactionResponse } from '@ethersproject/providers';
import { PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import { TransactionGasDetails } from '../fees/calculate-gas';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getAnyWalletForNetwork } from '../wallets/active-wallets';

const setGasDetails = (
  populatedTransaction: PopulatedTransaction,
  gasDetails: TransactionGasDetails,
): PopulatedTransaction => {
  const txWithGas = populatedTransaction;
  txWithGas.gasLimit = gasDetails.gasEstimate;
  txWithGas.gasPrice = gasDetails.gasPrice;
  return txWithGas;
};

export const executeTransaction = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
  gasDetails: TransactionGasDetails,
): Promise<TransactionResponse> => {
  const provider = getProviderForNetwork(chainID);
  const wallet = getAnyWalletForNetwork(chainID);
  const txWithGas = setGasDetails(populatedTransaction, gasDetails);
  const signedTransaction = await wallet.signTransaction(txWithGas);
  const txResponse = await provider.sendTransaction(signedTransaction);
  return txResponse;
};
