import { TransactionResponse } from '@ethersproject/providers';
import { PopulatedTransaction, Wallet as EthersWallet } from 'ethers';
import { ActiveWallet } from '../../models/wallet-models';
import { NetworkChainID } from '../config/config-chain-ids';
import { getSettingsNumber, storeSettingsNumber } from '../db/settings-db';
import { TransactionGasDetails } from '../fees/calculate-transaction-gas';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { createEthersWallet } from '../wallets/active-wallets';
import { setWalletAvailable } from '../wallets/available-wallets';
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
  const activeWallet = await getBestMatchWalletForNetwork(
    chainID,
    gasDetails.gasLimit,
  );
  const provider = getProviderForNetwork(chainID);
  const ethersWallet = createEthersWallet(activeWallet, provider);
  const nonce = await getCurrentNonce(ethersWallet);
  const finalTransaction: PopulatedTransaction = {
    ...populatedTransaction,
    gasLimit: gasDetails.gasLimit,
    gasPrice: gasDetails.gasPrice,
    nonce,
  };
  const signedTransaction = await ethersWallet.signTransaction(
    finalTransaction,
  );
  await storeCurrentNonce(nonce);
  const txResponse = await provider.sendTransaction(signedTransaction);
  // Call wait synchronously. This will set wallet unavailable until the tx is finished.
  waitForTx(activeWallet, txResponse);
  return txResponse;
};

export const waitForTx = async (
  activeWallet: ActiveWallet,
  txResponse: TransactionResponse,
) => {
  setWalletAvailable(activeWallet, false);
  await waitTx(txResponse);
  setWalletAvailable(activeWallet, true);
};

// Separated so it can be stubbed for tests.
export const waitTx = async (txResponse: TransactionResponse) => {
  await txResponse.wait();
};
