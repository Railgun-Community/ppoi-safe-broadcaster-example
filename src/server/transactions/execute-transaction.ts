import { TransactionResponse } from '@ethersproject/providers';
import { PopulatedTransaction, Wallet as EthersWallet } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { getSettingsNumber, storeSettingsNumber } from '../db/settings-db';
import { TransactionGasDetails } from '../fees/calculate-transaction-gas';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getBestMatchWalletForNetwork } from '../wallets/best-match-wallet';

const LAST_NONCE_KEY = 'last_nonce_key';

const setGasDetails = (
  populatedTransaction: PopulatedTransaction,
  gasDetails: TransactionGasDetails,
): PopulatedTransaction => {
  const txWithGas = populatedTransaction;
  txWithGas.gasLimit = gasDetails.gasLimit;
  txWithGas.gasPrice = gasDetails.gasPrice;
  return txWithGas;
};

const getCurrentNonce = async (wallet: EthersWallet): Promise<number> => {
  const [txCount, lastTransactionNonce] = await Promise.all([
    wallet.getTransactionCount(),
    await getSettingsNumber(LAST_NONCE_KEY),
  ]);
  if (lastTransactionNonce) {
    return Math.max(txCount, lastTransactionNonce + 1);
  }
  return txCount;
};

const storeCurrentNonce = async (nonce: number) => {
  await storeSettingsNumber(LAST_NONCE_KEY, nonce);
};

export const executeTransaction = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
  gasDetails: TransactionGasDetails,
): Promise<TransactionResponse> => {
  const wallet = await getBestMatchWalletForNetwork(
    chainID,
    gasDetails.gasLimit,
  );
  const nonce = await getCurrentNonce(wallet);
  // eslint-disable-next-line no-param-reassign
  populatedTransaction.nonce = nonce;
  await storeCurrentNonce(nonce);
  const txWithGas = setGasDetails(populatedTransaction, gasDetails);
  const signedTransaction = await wallet.signTransaction(txWithGas);
  const provider = getProviderForNetwork(chainID);
  const txResponse = await provider.sendTransaction(signedTransaction);
  return txResponse;
};
