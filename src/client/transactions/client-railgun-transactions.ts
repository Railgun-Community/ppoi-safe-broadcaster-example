import { PopulatedTransaction } from '@ethersproject/contracts';
import { ERC20Transaction } from '@railgun-community/lepton';
import { ERC20TransactionSerialized } from '@railgun-community/lepton/dist/transaction/erc20';
import { BytesData } from '@railgun-community/lepton/dist/utils/bytes';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { TokenAmount } from '../../models/token-models';
import { NetworkChainID } from '../../server/config/config-chain-ids';
import { TransactionGasDetails } from '../../server/fees/calculate-transaction-gas';
import { getLepton } from '../../server/lepton/lepton-init';
import { getRailgunClientWalletForID } from '../wallets/client-wallets';
import { getContractForNetwork } from './client-railgun-contract';

export type ProvedTransaction = {
  populatedTransaction: PopulatedTransaction;
  railWalletID: string;
  toWalletAddress: string;
  tokenAmounts: TokenAmount[];
};

export type ERC20TransactionAction = (
  erc20Transaction: ERC20Transaction,
  tokenAmount: TokenAmount,
  toWalletAddress: string,
) => void;

export const generateProofTransaction = async (
  chainID: NetworkChainID,
  railWalletID: string,
  toWalletAddress: string,
  encryptionKey: BytesData,
  tokenAmounts: TokenAmount[],
  action: ERC20TransactionAction,
): Promise<PopulatedTransaction> => {
  const railWallet = getRailgunClientWalletForID(railWalletID);

  const txs: ERC20TransactionSerialized[] =
    await erc20TransactionsFromTokenAmounts(
      tokenAmounts,
      railWallet,
      toWalletAddress,
      encryptionKey,
      chainID,
      action,
    );

  const railContract = getContractForNetwork(chainID);

  const populatedTransaction = await railContract.transact(txs);
  return populatedTransaction;
};

const erc20TransactionsFromTokenAmounts = async (
  tokenAmounts: TokenAmount[],
  railWallet: RailgunWallet,
  toWalletAddress: string,
  encryptionKey: BytesData,
  chainID: NetworkChainID,
  action: ERC20TransactionAction,
): Promise<ERC20TransactionSerialized[]> => {
  const lepton = getLepton();
  const prover = lepton.prover;

  const txs: ERC20TransactionSerialized[] = [];

  for (const tokenAmount of tokenAmounts) {
    const erc20Transaction = new ERC20Transaction(
      tokenAmount.tokenAddress,
      chainID,
    );

    // This is where we set .deposit, .withdraw or .outputs amounts.
    action(erc20Transaction, tokenAmount, toWalletAddress);

    const tx = await erc20Transaction.prove(prover, railWallet, encryptionKey);
    txs.push(tx);
  }

  return txs;
};

export const setGasDetailsForPopulatedTransaction = (
  populatedTransaction: PopulatedTransaction,
  gasDetails: TransactionGasDetails,
) => {
  populatedTransaction.gasLimit = gasDetails.gasLimit;
  populatedTransaction.gasPrice = gasDetails.gasPrice;
};
