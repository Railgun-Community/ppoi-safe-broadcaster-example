import { TransactionResponse } from '@ethersproject/providers';
import { RailgunProxyContract } from '@railgun-community/lepton/dist/contracts/railgun-proxy';
import {
  SerializedTransaction,
  TokenType,
} from '@railgun-community/lepton/dist/models/formatted-types';
import { Prover } from '@railgun-community/lepton/dist/prover';
import { TransactionBatch } from '@railgun-community/lepton/dist/transaction/transaction-batch';
import { Wallet } from '@railgun-community/lepton/dist/wallet';
import { PopulatedTransaction } from 'ethers';
import { TokenAmount } from '../../models/token-models';
import { NetworkChainID } from '../config/config-chain-ids';
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
  chainID: NetworkChainID,
): Promise<SerializedTransaction[]> => {
  const txBatchPromises: Promise<SerializedTransaction[]>[] = [];

  for (const tokenAmount of tokenAmounts) {
    const transactionBatch = new TransactionBatch(
      tokenAmount.tokenAddress,
      TokenType.ERC20,
      chainID,
    );

    const withdrawAmount = tokenAmount.amount;
    const value = withdrawAmount.toHexString();

    transactionBatch.setWithdraw(toWalletAddress, value, allowOverride);

    txBatchPromises.push(
      transactionBatch.generateSerializedTransactions(
        prover,
        railWallet,
        encryptionKey,
      ),
    );
  }

  const txBatches = await Promise.all(txBatchPromises);
  return txBatches.flat();
};

export const generatePopulatedUnshieldTransact = async (
  txs: SerializedTransaction[],
  networkName: NetworkChainID,
): Promise<PopulatedTransaction> => {
  const railContract = getProxyContractForNetwork(networkName);
  const populatedTransaction = await railContract.transact(txs);
  return populatedTransaction;
};

export const getProxyContractForNetwork = (
  chainID: NetworkChainID,
): RailgunProxyContract => {
  const proxyContract = getLepton().proxyContracts[chainID];
  if (!proxyContract) {
    throw new Error(
      `Proxy contract not yet loaded for network with chainID ${chainID}`,
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
  chainID: NetworkChainID,
): Promise<TransactionResponse> => {
  const serializedTransactions = await generateUnshieldTransactions(
    prover,
    railWallet,
    encryptionKey,
    toWalletAddress,
    allowOverride,
    tokenAmounts,
    chainID,
  );
  const populatedTransaction = await generatePopulatedUnshieldTransact(
    serializedTransactions,
    chainID,
  );
  const gasDetails = await getEstimateGasDetails(chainID, populatedTransaction);
  const batchResponse = await executeTransaction(
    chainID,
    populatedTransaction,
    gasDetails,
  );
  return batchResponse;
};
