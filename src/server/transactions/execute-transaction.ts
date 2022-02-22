import { TransactionResponse } from '@ethersproject/providers';
import { PopulatedTransaction, Wallet as EthersWallet } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { getSettingsNumber, storeSettingsNumber } from '../db/settings-db';
import { TransactionGasDetails } from '../fees/calculate-transaction-gas';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getBestMatchWalletForNetwork } from '../wallets/best-match-wallet';

export const LAST_NONCE_KEY = 'last_nonce_key';

export const getCurrentNonce = async (
  wallet: EthersWallet,
): Promise<number> => {
  const [txCount, lastTransactionNonce] = await Promise.all([
    wallet.getTransactionCount(),
    await getSettingsNumber(LAST_NONCE_KEY),
  ]);
  if (lastTransactionNonce) {
    return Math.max(txCount, lastTransactionNonce + 1);
  }
  return txCount;
};

export const storeCurrentNonce = async (nonce: number) => {
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
  const finalTransaction: PopulatedTransaction = {
    ...populatedTransaction,
    gasLimit: gasDetails.gasLimit,
    gasPrice: gasDetails.gasPrice,
    nonce,
  };
  const signedTransaction = await wallet.signTransaction(finalTransaction);
  const provider = getProviderForNetwork(chainID);
  await storeCurrentNonce(nonce);
  return provider.sendTransaction(signedTransaction);
};
