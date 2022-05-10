import { TransactionResponse } from '@ethersproject/providers';
import debug from 'debug';
import { PopulatedTransaction, Wallet as EthersWallet } from 'ethers';
import { EVMGasType } from '../../models/network-models';
import { ActiveWallet } from '../../models/wallet-models';
import { throwErr } from '../../util/promise-utils';
import { updateCachedGasTokenBalance } from '../balances/balance-cache';
import { NetworkChainID } from '../config/config-chain-ids';
import { getSettingsNumber, storeSettingsNumber } from '../db/settings-db';
import {
  calculateGasLimit,
  calculateMaximumGas,
  TransactionGasDetails,
} from '../fees/gas-estimate';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { createEthersWallet } from '../wallets/active-wallets';
import { setWalletAvailable } from '../wallets/available-wallets';
import { getBestMatchWalletForNetwork } from '../wallets/best-match-wallet';

const dbg = debug('relayer:transact:execute');

const LAST_NONCE_KEY = 'last_nonce_key';

export const getLastNonceKey = (wallet: EthersWallet) => {
  return `${LAST_NONCE_KEY}|${wallet.address}}`;
};

export const getCurrentNonce = async (
  wallet: EthersWallet,
): Promise<number> => {
  const [txCount, lastTransactionNonce] = await Promise.all([
    wallet.getTransactionCount().catch(throwErr),
    await getSettingsNumber(getLastNonceKey(wallet)),
  ]);
  if (lastTransactionNonce) {
    return Math.max(txCount, lastTransactionNonce + 1);
  }
  return txCount;
};

export const storeCurrentNonce = async (
  nonce: number,
  wallet: EthersWallet,
) => {
  await storeSettingsNumber(getLastNonceKey(wallet), nonce);
};

export const executeTransaction = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
  gasDetails: TransactionGasDetails,
): Promise<TransactionResponse> => {
  dbg('Execute transaction');

  const maximumGas = calculateMaximumGas(gasDetails);
  const activeWallet = await getBestMatchWalletForNetwork(chainID, maximumGas);
  const provider = getProviderForNetwork(chainID);
  const ethersWallet = createEthersWallet(activeWallet, provider);
  const nonce = await getCurrentNonce(ethersWallet);
  dbg('Nonce', nonce);

  const finalTransaction: PopulatedTransaction = {
    ...populatedTransaction,
    chainId: chainID,
    nonce,
    gasLimit: calculateGasLimit(gasDetails.gasEstimate),
  };

  switch (gasDetails.evmGasType) {
    case EVMGasType.Type0: {
      const { gasPrice } = gasDetails;
      finalTransaction.type = 0;
      finalTransaction.gasPrice = gasPrice;
      dbg(`Gas price: ${gasPrice.toString()}`);
      break;
    }
    case EVMGasType.Type2: {
      const { maxFeePerGas, maxPriorityFeePerGas } = gasDetails;
      finalTransaction.type = 2;
      finalTransaction.maxFeePerGas = maxFeePerGas;
      finalTransaction.maxPriorityFeePerGas = maxPriorityFeePerGas;
      dbg(`Max fee per gas: ${maxFeePerGas.toString()}`);
      dbg(`Max priority fee: ${maxPriorityFeePerGas.toString()}`);
      break;
    }
  }

  const signedTransaction = await ethersWallet.signTransaction(
    finalTransaction,
  );
  dbg('Signed transaction');

  const txResponse = await provider
    .sendTransaction(signedTransaction)
    .catch(throwErr);
  dbg(`Submitted transaction: ${txResponse.hash}`);

  // Call wait synchronously. This will set wallet unavailable until the tx is finished.
  waitForTx(activeWallet, ethersWallet, chainID, txResponse, nonce);
  return txResponse;
};

export const waitForTx = async (
  activeWallet: ActiveWallet,
  ethersWallet: EthersWallet,
  chainID: NetworkChainID,
  txResponse: TransactionResponse,
  nonce: number,
) => {
  try {
    setWalletAvailable(activeWallet, chainID, false);
    await waitTx(txResponse);
    dbg(`Transaction completed/mined: ${txResponse.hash}`);
    await storeCurrentNonce(nonce, ethersWallet);
  } catch (err) {
    dbg(`Transaction ${txResponse.hash} error: ${err.message}`);
  } finally {
    setWalletAvailable(activeWallet, chainID, true);
    await updateCachedGasTokenBalance(chainID, activeWallet.address);
  }
};

// Separated so it can be stubbed for tests.
export const waitTx = async (txResponse: TransactionResponse) => {
  await txResponse.wait().catch(throwErr);
};
