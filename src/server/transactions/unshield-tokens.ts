import { TransactionResponse } from '@ethersproject/providers';
import {
  Prover,
  RailgunWallet,
  TransactionStruct,
  TransactionBatch,
  TokenType,
  RailgunProxyContract,
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
import { getRailgunEngine } from '../lepton/lepton-init';
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
    const transactionBatch = new TransactionBatch(
      tokenAmount.tokenAddress,
      TokenType.ERC20,
      chain,
    );

    const withdrawAmount = tokenAmount.amount;
    const value = withdrawAmount.toHexString();

    transactionBatch.setUnshield(toWalletAddress, value, allowOverride);

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
  const railContract = getProxyContractForNetwork(chain);
  const populatedTransaction = await railContract.transact(txs);
  return populatedTransaction;
};

export const getProxyContractForNetwork = (
  chain: RelayerChain,
): RailgunProxyContract => {
  const proxyContract = getRailgunEngine().proxyContracts[chain.type][chain.id];
  if (!proxyContract) {
    throw new Error(
      `Proxy contract not yet loaded for network with chain ${chain.type}:${chain.id}`,
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
