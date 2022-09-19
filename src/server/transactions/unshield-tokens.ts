import { TransactionResponse } from '@ethersproject/providers';
import { RailgunProxyContract } from '@railgun-community/lepton/dist/contracts/railgun-proxy';
import {
  SerializedTransaction,
  TokenType,
} from '@railgun-community/lepton/dist/models/formatted-types';
import { Chain } from '@railgun-community/lepton/dist/models/lepton-types';
import { Prover } from '@railgun-community/lepton/dist/prover';
import { TransactionBatch } from '@railgun-community/lepton/dist/transaction/transaction-batch';
import { Wallet } from '@railgun-community/lepton/dist/wallet/wallet';
import { PopulatedTransaction } from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { TokenAmount } from '../../models/token-models';
import { getEstimateGasDetails } from '../fees/gas-estimate';
import { getLepton } from '../lepton/lepton-init';
import { executeTransaction } from './execute-transaction';

export const generateUnshieldTransactions = async (
  prover: Prover,
  railWallet: Wallet,
  encryptionKey: string,
  toWalletAddress: string,
  allowOverride: boolean,
  tokenAmounts: TokenAmount[],
  chain: RelayerChain,
): Promise<SerializedTransaction[]> => {
  const txBatchPromises: Promise<SerializedTransaction[]>[] = [];

  for (const tokenAmount of tokenAmounts) {
    const transactionBatch = new TransactionBatch(
      tokenAmount.tokenAddress,
      TokenType.ERC20,
      chain,
    );

    const withdrawAmount = tokenAmount.amount;
    const value = withdrawAmount.toHexString();

    transactionBatch.setWithdraw(toWalletAddress, value, allowOverride);

    txBatchPromises.push(
      transactionBatch.generateSerializedTransactions(
        prover,
        railWallet,
        encryptionKey,
        () => {}, // progressCallback
      ),
    );
  }

  const txBatches = await Promise.all(txBatchPromises);
  return txBatches.flat();
};

export const generatePopulatedUnshieldTransact = async (
  txs: SerializedTransaction[],
  chain: Chain,
): Promise<PopulatedTransaction> => {
  const railContract = getProxyContractForNetwork(chain);
  const populatedTransaction = await railContract.transact(txs);
  return populatedTransaction;
};

export const getProxyContractForNetwork = (
  chain: RelayerChain,
): RailgunProxyContract => {
  const proxyContract = getLepton().proxyContracts[chain.type][chain.id];
  if (!proxyContract) {
    throw new Error(
      `Proxy contract not yet loaded for network with chain ${chain.type}:${chain.id}`,
    );
  }
  return proxyContract;
};

export const unshieldTokens = async (
  prover: Prover,
  railWallet: Wallet,
  encryptionKey: string,
  toWalletAddress: string,
  allowOverride: boolean,
  tokenAmounts: TokenAmount[],
  chain: RelayerChain,
): Promise<TransactionResponse> => {
  const serializedTransactions = await generateUnshieldTransactions(
    prover,
    railWallet,
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
  const gasDetails = await getEstimateGasDetails(chain, populatedTransaction);
  const batchResponse = await executeTransaction(
    chain,
    populatedTransaction,
    gasDetails,
  );
  return batchResponse;
};
