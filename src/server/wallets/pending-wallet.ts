import { ContractTransaction, Wallet, parseUnits } from 'ethers';
import { BroadcasterChain } from '../../models/chain-models';
import { ActiveWallet } from '../../models/wallet-models';
import { delay } from '../../util/promise-utils';
import { getFirstJsonRpcProviderForNetwork } from '../providers/active-network-providers';
import { isDefined, promiseTimeout } from '@railgun-community/shared-models';
import debug from 'debug';
import { NetworkChainID } from '../config/config-chains';
import configDefaults from '../config/config-defaults';

const dbg = debug('broadcaster:pending-transaction');

const pendingTransactionCache: NumMapType<NumMapType<MapType<boolean>>> = {};
const initPendingTransactionCache = (chain: BroadcasterChain) => {
  pendingTransactionCache[chain.type] ??= {};
  pendingTransactionCache[chain.type][chain.id] ??= {};
};

const getPendingCache = (chain: BroadcasterChain, wallet: ActiveWallet) => {
  return pendingTransactionCache[chain.type][chain.id][wallet.address];
};

const populateTerminationTransaction = async (
  chain: BroadcasterChain,
  wallet: ActiveWallet,
): Promise<ContractTransaction | undefined> => {
  // get the current nonce,

  const info = await getTransactionCounts(chain, wallet);

  if (isDefined(info)) {
    if (info.latest === info.pending) {
      // transaction has resolved? exit?
      return undefined;
    }

    // const provider = getFirstJsonRpcProviderForNetwork(chain);
    // const feeData = await provider.getFeeData().catch((err) => {
    //   dbg(err);
    //   return undefined;
    // });
    // if (!isDefined(feeData)) {
    //   return undefined;
    // }
    // const { gasPrice } = feeData;

    // if (!isDefined(gasPrice)) {
    //   return undefined;
    // }

    const nonce = info.latest; // should only have one pending tx, lets nuke it.
    const difference = info.pending - info.latest;
    dbg(`TERMINATION INFO`, info);
    dbg(`Pending Count: ${difference}`);

    const type = chain.id === NetworkChainID.BNBChain ? 0 : 1;

    const transaction: ContractTransaction = {
      to: wallet.address,
      value: parseUnits('0.01', 'ether'), //
      data: '',
      gasLimit: 21000n,
      chainId: BigInt(chain.id),
      type,
      nonce,
      // gasPrice, // TODO: maybe dont need to set this? i think ethers will auto set it just fine?
    };
    return transaction;
  }
  return undefined;
};

const sendTerminationTransaction = async (
  chain: BroadcasterChain,
  wallet: ActiveWallet,
) => {
  const terminationTransaction = await populateTerminationTransaction(
    chain,
    wallet,
  );
  if (isDefined(terminationTransaction)) {
    dbg('Termination Transaction', terminationTransaction);
    const provider = getFirstJsonRpcProviderForNetwork(chain);
    const ethersWallet = new Wallet(wallet.pkey, provider);
    const populatedTranaction = await ethersWallet.populateTransaction(
      terminationTransaction,
    );
    dbg('Populated Transaction', populatedTranaction);
    const termTxHash = await promiseTimeout(
      ethersWallet.sendTransaction(populatedTranaction),
      2 * 60 * 1000,
    ).catch((err) => {
      dbg(`TERM TRANSACTION FAILURE?`, err);
      return undefined;
    });

    if (!isDefined(termTxHash)) {
      dbg('THERE WAS AN ERROR?');
      return;
    }

    dbg(
      `TERMINATION SUCCESS:  Chain ${chain.type}:${chain.id} txid: ${termTxHash}`,
    );
  }
};

const pollPendingTransactions = async (
  chain: BroadcasterChain,
  wallet: ActiveWallet,
  retryCount = 0,
) => {
  const {
    maxPendingTxRetryCount,
    pendingTxPollingDelay,
    terminatePendingTransactions,
  } = configDefaults;

  if (!terminatePendingTransactions) {
    return;
  }

  if (retryCount === 0) {
    dbg('Initializing Pending Transaction Poller.');
    dbg('Awaiting transaction to send...');
    await delay(20 * 1000);
  }
  dbg(
    `Polling Pending Transactions for ${wallet.address} on ${chain.type}:${chain.id}`,
  );

  const hasPending = getPendingCache(chain, wallet);

  if (hasPending) {
    await checkForPendingTransactions(chain, wallet);

    const stillHasPending = getPendingCache(chain, wallet);
    if (stillHasPending) {
      if (retryCount < maxPendingTxRetryCount) {
        dbg('Starting Delay Timer');
        await delay(pendingTxPollingDelay);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        pollPendingTransactions(chain, wallet, retryCount + 1);
      } else {
        // send execution transaction.
        dbg('SENDING TERMINATION TRANSACTION');
        await sendTerminationTransaction(chain, wallet);
      }
    } else {
      dbg('No remaining pending transactions');
    }
  } else {
    dbg('No pending transactions found.');
  }
};

export const updatePendingTransactions = (
  wallet: ActiveWallet,
  chain: BroadcasterChain,
  value: boolean,
) => {
  initPendingTransactionCache(chain);
  // should only be called by execute-transaction
  dbg('Updating Pending Status as | ', value);
  pendingTransactionCache[chain.type][chain.id][wallet.address] = value;
  if (value === true) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    pollPendingTransactions(chain, wallet);
  }
};

const checkForPendingTransactions = async (
  chain: BroadcasterChain,
  wallet: ActiveWallet,
) => {
  try {
    const txCountPromise = await getTransactionCounts(chain, wallet);

    if (isDefined(txCountPromise)) {
      const { pending, latest } = txCountPromise;

      const pendingCount = pending - latest;
      const hasTransactions = pendingCount > 0;
      initPendingTransactionCache(chain);
      pendingTransactionCache[chain.type][chain.id][wallet.address] =
        hasTransactions;
    }
  } catch (error) {
    dbg(error.message);
  }
};

// this only gets called when a wallet is being selected for sending a tx
export const hasPendingTransactions = (
  wallet: ActiveWallet,
  chain: BroadcasterChain,
): boolean => {
  initPendingTransactionCache(chain);

  const cached = getPendingCache(chain, wallet);
  if (isDefined(cached)) {
    // if cached is true means we need to lazyload poll it to update. keep true state for now, it will update on its own.
    if (cached === true) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      checkForPendingTransactions(chain, wallet);
      //
    }
    return cached;
  }
  // upon initial start of the broadcaster, no accounts should have pending transactions.
  // or any subsequent restarts. please make sure to clear them out then restart if they become an issue.
  pendingTransactionCache[chain.type][chain.id][wallet.address] = false;
  return false;
};
type TransactionCount = {
  pending: number;
  latest: number;
};

const getTransactionCounts = async (
  chain: BroadcasterChain,
  wallet: ActiveWallet,
): Promise<TransactionCount | undefined> => {
  const provider = getFirstJsonRpcProviderForNetwork(chain);

  const TIMEOUT_DELAY = 5 * 1000;

  try {
    const pending = await promiseTimeout(
      provider.getTransactionCount(wallet.address, 'pending'),
      TIMEOUT_DELAY,
    );
    await delay(200);
    const latest = await promiseTimeout(
      provider.getTransactionCount(wallet.address, 'latest'),
      TIMEOUT_DELAY,
    );
    return { pending, latest };
  } catch (error) {
    return undefined;
  }
};
