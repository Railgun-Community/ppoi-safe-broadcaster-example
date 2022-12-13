import { TransactionResponse } from '@ethersproject/providers';
import {
  Prover,
  RailgunWallet,
  TransactionStruct,
  TransactionBatch,
  RailgunSmartWalletContract,
  getTokenDataERC20,
} from '@railgun-community/engine';
import {
  Chain,
  getEVMGasTypeForTransaction,
  networkForChain,
} from '@railgun-community/shared-models';
import debug from 'debug';
import { PopulatedTransaction } from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { TokenAmount } from '../../models/token-models';
import { getEstimateGasDetailsPublic } from '../fees/gas-estimate';
import { getRailgunEngine } from '../engine/engine-init';
import { executeTransaction } from './execute-transaction';

const dbg = debug('relayer:unshield-tokens');

export const generateUnshieldTransactions = async (
  prover: Prover,
  railgunWallet: RailgunWallet,
  encryptionKey: string,
  toWalletAddress: string,
  allowOverride: boolean,
  tokenAmounts: TokenAmount[],
  chain: RelayerChain,
): Promise<TransactionStruct[]> => {
  const txBatchPromises: Promise<TransactionStruct[]>[] = [];

  for (const tokenAmount of tokenAmounts) {
    const transactionBatch = new TransactionBatch(chain);

    transactionBatch.addUnshieldData({
      toAddress: toWalletAddress,
      value: tokenAmount.amount.toBigInt(),
      tokenData: getTokenDataERC20(tokenAmount.tokenAddress),
      allowOverride,
    });

    txBatchPromises.push(
      transactionBatch.generateTransactions(
        prover,
        railgunWallet,
        encryptionKey,
        () => {}, // progressCallback
      ),
    );
  }
  const txBatches: TransactionStruct[][] = [];

  // do not require success of *all* batch unshields; return succesful and report failures
  const results = await Promise.allSettled(txBatchPromises);
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      txBatches.push(result.value);
    } else if (result.status === 'rejected') {
      dbg(
        `Error generating batch unshield tx of ${tokenAmounts[index].tokenAddress}: ${result.reason}`,
      );
    }
  });

  return txBatches.flat();
};

export const generatePopulatedUnshieldTransact = async (
  txs: TransactionStruct[],
  chain: Chain,
): Promise<PopulatedTransaction> => {
  const railContract = getRailgunSmartWalletContractForNetwork(chain);
  const populatedTransaction = await railContract.transact(txs);
  return populatedTransaction;
};

export const getRailgunSmartWalletContractForNetwork = (
  chain: RelayerChain,
): RailgunSmartWalletContract => {
  const proxyContract =
    getRailgunEngine().railgunSmartWalletContracts[chain.type][chain.id];
  if (!proxyContract) {
    throw new Error(
      `RAILGUN Smart Wallet contract not yet loaded for network with chain ${chain.type}:${chain.id}`,
    );
  }
  return proxyContract;
};

export const unshieldTokens = async (
  prover: Prover,
  railgunWallet: RailgunWallet,
  encryptionKey: string,
  toWalletAddress: string,
  allowOverride: boolean,
  tokenAmounts: TokenAmount[],
  chain: RelayerChain,
): Promise<TransactionResponse> => {
  const serializedTransactions = await generateUnshieldTransactions(
    prover,
    railgunWallet,
    encryptionKey,
    toWalletAddress,
    allowOverride,
    tokenAmounts,
    chain,
  );
  const populatedTransaction = await generatePopulatedUnshieldTransact(
    serializedTransactions,
    chain,
  );
  const network = networkForChain(chain);
  if (!network) {
    throw new Error(`Unsupported network for chain ${chain.type}:${chain.id}`);
  }
  const sendWithPublicWallet = true;
  const evmGasType = getEVMGasTypeForTransaction(
    network.name,
    sendWithPublicWallet,
  );
  const gasDetails = await getEstimateGasDetailsPublic(
    chain,
    evmGasType,
    populatedTransaction,
  );
  const batchResponse = await executeTransaction(
    chain,
    populatedTransaction,
    gasDetails,
  );
  return batchResponse;
};
