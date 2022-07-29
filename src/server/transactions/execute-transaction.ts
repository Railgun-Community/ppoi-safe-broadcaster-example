import {
  TransactionRequest,
  TransactionResponse,
} from '@ethersproject/providers';
import debug from 'debug';
import { Wallet as EthersWallet } from 'ethers';
import { EVMGasType } from '../../models/network-models';
import { ActiveWallet } from '../../models/wallet-models';
import { ErrorMessage } from '../../util/errors';
import { promiseTimeout, throwErr } from '../../util/promise-utils';
import { minBigNumber } from '../../util/utils';
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

export const getLastNonceKey = (
  chainID: NetworkChainID,
  wallet: EthersWallet,
) => {
  return `${LAST_NONCE_KEY}|${wallet.address}|${chainID}}`;
};

export const getCurrentWalletNonce = async (
  wallet: EthersWallet,
): Promise<number> => {
  try {
    const blockTag = 'pending';
    return await wallet.getTransactionCount(blockTag);
  } catch (err) {
    return throwErr(err);
  }
};

/**
 * NOTE: This nonce storage has been unreliable...
 * Since we keep the wallet locked while a tx is pending, we can just use the tx count.
 * Only limitation is if we restart during a pending tx, but blockTag 'pending' seems to help.
 */
export const getCurrentNonce = async (
  chainID: NetworkChainID,
  wallet: EthersWallet,
): Promise<number> => {
  const blockTag = 'pending';
  const [txCount, lastTransactionNonce] = await Promise.all([
    wallet.getTransactionCount(blockTag).catch(throwErr),
    await getSettingsNumber(getLastNonceKey(chainID, wallet)),
  ]);
  if (lastTransactionNonce) {
    return Math.max(txCount, lastTransactionNonce + 1);
  }
  return txCount;
};

export const storeCurrentNonce = async (
  chainID: NetworkChainID,
  nonce: number,
  wallet: EthersWallet,
) => {
  await storeSettingsNumber(getLastNonceKey(chainID, wallet), nonce);
};

export const executeTransaction = async (
  chainID: NetworkChainID,
  transactionRequest: TransactionRequest,
  gasDetails: TransactionGasDetails,
): Promise<TransactionResponse> => {
  dbg('Execute transaction');

  const maximumGas = calculateMaximumGas(gasDetails);
  const activeWallet = await getBestMatchWalletForNetwork(chainID, maximumGas);
  const provider = getProviderForNetwork(chainID);
  const ethersWallet = createEthersWallet(activeWallet, provider);
  const nonce = await getCurrentWalletNonce(ethersWallet);
  const gasLimit = calculateGasLimit(gasDetails.gasEstimate);
  dbg('Nonce', nonce);

  const finalTransaction: TransactionRequest = {
    ...transactionRequest,
    chainId: chainID,
    nonce,
    gasLimit,
  };

  dbg(`Gas limit: ${gasLimit.toString()}`);

  switch (gasDetails.evmGasType) {
    case EVMGasType.Type0: {
      const { gasPrice } = gasDetails;
      finalTransaction.type = 0;
      finalTransaction.gasPrice = gasPrice;
      delete finalTransaction.maxFeePerGas;
      delete finalTransaction.maxPriorityFeePerGas;
      dbg(`Gas price: ${gasPrice.toString()}`);
      break;
    }
    case EVMGasType.Type2: {
      const { maxFeePerGas, maxPriorityFeePerGas } = gasDetails;
      finalTransaction.type = 2;
      finalTransaction.maxFeePerGas = maxFeePerGas;
      finalTransaction.maxPriorityFeePerGas = minBigNumber(
        maxFeePerGas,
        maxPriorityFeePerGas,
      );
      delete finalTransaction.gasPrice;
      dbg(`Max fee per gas: ${maxFeePerGas.toString()}`);
      dbg(`Max priority fee: ${maxPriorityFeePerGas.toString()}`);
      break;
    }
  }

  try {
    dbg('Submitting transaction');
    dbg(finalTransaction);

    const txResponse = await promiseTimeout(
      ethersWallet.sendTransaction(finalTransaction),
      15000, // 15 second time-out.
    );

    dbg('Submitted transaction:', txResponse.hash);

    // Call wait synchronously. This will set wallet unavailable until the tx is finished.
    waitForTx(activeWallet, ethersWallet, chainID, txResponse, nonce);
    return txResponse;
  } catch (err) {
    if (err?.message?.includes('Timed out')) {
      throw new Error(ErrorMessage.TRANSACTION_SEND_TIMEOUT_ERROR);
    }

    dbg(err);
    throw new Error('Could not send transaction.');
  }
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
    await storeCurrentNonce(chainID, nonce, ethersWallet);
  } catch (err) {
    dbg(`Transaction ${txResponse.hash} error: ${err.message}`);
  } finally {
    setWalletAvailable(activeWallet, chainID, true);
    await updateCachedGasTokenBalance(chainID, activeWallet.address);
  }
};

// Separated so it can be stubbed for tests.
export const waitTx = async (txResponse: TransactionResponse) => {
  const timeout = 5 * 60 * 1000; // 5 minutes
  await promiseTimeout(txResponse.wait().catch(throwErr), timeout);
};
