import {
  EVMGasType,
  TXIDVersion,
  TransactionGasDetails,
  delay,
  isDefined,
} from '@railgun-community/shared-models';
import debug from 'debug';
import {
  ContractTransaction,
  Wallet as EthersWallet,
  TransactionResponse,
  keccak256,
} from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { ActiveWallet } from '../../models/wallet-models';
import { ErrorMessage, sanitizeRelayerError } from '../../util/errors';
import { promiseTimeout, throwErr } from '../../util/promise-utils';
import { minBigInt } from '../../util/utils';
import { updateCachedGasTokenBalance } from '../balances/balance-cache';
import { getSettingsNumber, storeSettingsNumber } from '../db/settings-db';
import {
  calculateGasLimitRelayer,
  calculateMaximumGasRelayer,
} from '../fees/gas-estimate';
import { getFirstJsonRpcProviderForNetwork } from '../providers/active-network-providers';
import { createEthersWallet } from '../wallets/active-wallets';
import { setWalletAvailability } from '../wallets/available-wallets';
import { updatePendingTransactions } from '../wallets/pending-wallet';
import { getBestMatchWalletForNetwork } from '../wallets/best-match-wallet';
import {
  cacheSubmittedTx,
  cleanupSubmittedTxs,
  removeSubmittedTx,
  txWasAlreadySent,
} from '../fees/gas-price-cache';
import { ValidatedPOIData } from './poi-validator';
import { POIAssurance } from './poi-assurance';

const dbg = debug('relayer:transact:execute');

const LAST_NONCE_KEY = 'last_nonce_key';

export const getLastNonceKey = (chain: RelayerChain, wallet: EthersWallet) => {
  return `${LAST_NONCE_KEY}|${wallet.address}|${chain.type}|${chain.id}`;
};

export const getCurrentWalletNonce = async (
  wallet: EthersWallet,
): Promise<number> => {
  try {
    const blockTag = 'pending';

    const result = await promiseTimeout(wallet.getNonce(blockTag), 10 * 1000);

    return result;
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
  chain: RelayerChain,
  wallet: EthersWallet,
): Promise<number> => {
  const blockTag = 'pending';
  const [nonce, lastTransactionNonce] = await Promise.all([
    wallet.getNonce(blockTag).catch(throwErr),
    await getSettingsNumber(getLastNonceKey(chain, wallet)),
  ]);
  if (isDefined(lastTransactionNonce)) {
    return Math.max(nonce, lastTransactionNonce + 1);
  }
  return nonce;
};

export const storeCurrentNonce = async (
  chain: RelayerChain,
  nonce: number,
  wallet: EthersWallet,
) => {
  await storeSettingsNumber(getLastNonceKey(chain, wallet), nonce);
};

export const executeTransaction = async (
  chain: RelayerChain,
  transaction: ContractTransaction,
  gasDetails: TransactionGasDetails,
  txidVersion?: TXIDVersion,
  validatedPOIData?: ValidatedPOIData,
  wallet?: ActiveWallet,
  overrideNonce?: number,
  setAvailability = true,
  setTxCached = true,
): Promise<TransactionResponse> => {
  dbg('Execute transaction');

  const maximumGas = calculateMaximumGasRelayer(gasDetails, chain);
  const activeWallet =
    wallet ?? (await getBestMatchWalletForNetwork(chain, maximumGas));

  const provider = getFirstJsonRpcProviderForNetwork(chain);
  const ethersWallet = createEthersWallet(activeWallet, provider);
  const nonce = overrideNonce ?? (await getCurrentWalletNonce(ethersWallet));
  const gasLimit = calculateGasLimitRelayer(gasDetails.gasEstimate, chain);
  // dbg('Nonce', nonce);

  const finalTransaction: ContractTransaction = {
    ...transaction,
    chainId: BigInt(chain.id),
    nonce,
    gasLimit,
  };

  // dbg(`Gas limit: ${gasLimit}`);
  // dbg(`Gas details: ${gasDetails}`);

  finalTransaction.type = gasDetails.evmGasType;

  switch (gasDetails.evmGasType) {
    case EVMGasType.Type0:
    case EVMGasType.Type1: {
      const { gasPrice } = gasDetails;
      finalTransaction.gasPrice = gasPrice;
      // dbg(`Gas price: ${gasPrice}`);
      break;
    }
    case EVMGasType.Type2: {
      const { maxFeePerGas, maxPriorityFeePerGas } = gasDetails;
      finalTransaction.maxFeePerGas = maxFeePerGas;
      finalTransaction.maxPriorityFeePerGas = minBigInt(
        maxFeePerGas,
        maxPriorityFeePerGas,
      );
      // dbg(`Max fee per gas: ${maxFeePerGas}`);
      // dbg(`Max priority fee: ${maxPriorityFeePerGas}`);
      break;
    }
  }
  let hashGlobal = '';

  try {
    dbg('Submitting transaction');
    dbg(finalTransaction);

    // hash the finalTransaction.data, cache this for 3 minutes, or until the tx mines.
    // having multiple tx come through with different pub keys, at the same time.
    // they both get submitted. because the second ones gas estimate doesnt fail because its not mined yet.
    if (setTxCached) {
      const hashOfData = hashTransactionRequest(finalTransaction);
      if (isDefined(hashOfData)) {
        hashGlobal = hashOfData;
        // cache this so we can compare if its been used or not.
        // this should stop the double transactions making their way through.
        // idea is to set this, and before we go further here. check if the hash has been used successfuly
        // cache object will have tx completed status,
        // these will clear out after 10 minute expiry.

        // run cleanup first,
        cleanupSubmittedTxs(chain);

        if (txWasAlreadySent(chain, hashOfData)) {
          throw new Error(ErrorMessage.REPEAT_TRANSACTION);
        }
        cacheSubmittedTx(chain, hashOfData);
      }
    }

    setWalletAvailability(activeWallet, chain, false);
    updatePendingTransactions(activeWallet, chain, true); // set it before, incase we encounter error and dont get hash, it should still properly poll.

    const txResponse: TransactionResponse = await promiseTimeout(
      ethersWallet.sendTransaction(finalTransaction),
      // 45-second time-out. A shorter or longer timeout may cause issues with frontends.
      // Frontends submit to relayers with their own timeout; the frontend timeout may lapse before the Relayer timeout.
      45000,
    );

    dbg('Submitted transaction:', txResponse.hash);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises

    if (setTxCached) {

      waitForTx(
        activeWallet,
        ethersWallet,
        chain,
        txResponse,
        nonce,
        setAvailability,
      ).finally(() => {
        if (hashGlobal !== '') {
          removeSubmittedTx(chain, hashGlobal);
        }
      });
    }
    if (validatedPOIData) {
      if (!isDefined(txidVersion)) {
        dbg('WARNING: No txidVersion - cannot queue validated poi');
      } else {
        await POIAssurance.queueValidatedPOI(
          txidVersion,
          chain,
          txResponse.hash,
          validatedPOIData,
        );
      }
    }

    return txResponse;
  } catch (err) {
    dbg(err);
    // if theres an error, clear submitted tx hash so it can be resent again.
    if (hashGlobal !== '') {
      removeSubmittedTx(chain, hashGlobal);
    }
    const errMsg: Optional<string> = err?.message;

    if (isDefined(errMsg) && errMsg.includes('already known')) {
      await delay(45000); // force the mined pickup?
      throw sanitizeRelayerError(err);
    }
    setWalletAvailability(activeWallet, chain, true);

    if (isDefined(errMsg) && errMsg.includes('Timed out')) {
      throw new Error(ErrorMessage.TRANSACTION_SEND_TIMEOUT_ERROR);
    }

    if (isDefined(errMsg)) {
      if (errMsg.includes('missing response for request')) {
        //
        dbg(errMsg);
        throw new Error(ErrorMessage.MISSING_RESPONSE);
      }
      if (errMsg.includes('server response 512')) {
        //
        dbg(errMsg);
        throw new Error(ErrorMessage.BAD_RESPONSE);
      }
      if (
        errMsg.includes('Nonce already used') ||
        errMsg.includes('nonce has already been used')
      ) {
        dbg('WEIRD BAD RETURN?... ');
        dbg(errMsg);

        throw new Error(ErrorMessage.NONCE_ALREADY_USED);

        // throw new Error(ErrorMessage.TRANSACTION_SEND_RPC_ERROR);
        // Try again with increased nonce.
        // return executeTransaction(
        //   chain,
        //   transaction,
        //   gasDetails,
        //   activeWallet,
        //   nonce + 1,
        //   setAvailability,
        // );
      }

      if (errMsg.includes('transaction underpriced')) {
        dbg('Underpriced Error');
        throw new Error(ErrorMessage.TRANSACTION_UNDERPRICED);
      }
    }
    // nonce errors

    throw sanitizeRelayerError(err);
  }
};

const hashTransactionRequest = (
  request: ContractTransaction,
): Optional<string> => {
  if (request.data) {
    const dataHash = keccak256(request.data);
    return dataHash;
  }
  return undefined;
};

export const waitForTx = async (
  activeWallet: ActiveWallet,
  ethersWallet: EthersWallet,
  chain: RelayerChain,
  txResponse: TransactionResponse,
  nonce: number,
  setAvailability = true,
) => {
  try {
    await waitTx(txResponse);
    dbg(`Transaction completed/mined: ${txResponse.hash}`);
    updatePendingTransactions(activeWallet, chain, false);
    await storeCurrentNonce(chain, nonce, ethersWallet);
  } catch (err) {
    dbg(`Transaction ${txResponse.hash} error: ${err.message}`);
  } finally {
    await updateCachedGasTokenBalance(chain, activeWallet.address);
    if (setAvailability) setWalletAvailability(activeWallet, chain, true);
  }
};

export const waitForTxs = async (
  activeWallet: ActiveWallet,
  ethersWallet: EthersWallet,
  chain: RelayerChain,
  txResponses: TransactionResponse[],
  setAvailability?: boolean,
) => {
  await Promise.all(
    txResponses.map(async (txResponse) => {
      const nonce = await getCurrentWalletNonce(ethersWallet);
      await waitForTx(
        activeWallet,
        ethersWallet,
        chain,
        txResponse,
        nonce,
        setAvailability,
      );
    }),
  );
};

// Separated so it can be stubbed for tests.
export const waitTx = async (txResponse: TransactionResponse) => {
  const timeout = 5 * 60 * 1000; // 5 minutes
  await promiseTimeout(txResponse.wait().catch(throwErr), timeout);
};
