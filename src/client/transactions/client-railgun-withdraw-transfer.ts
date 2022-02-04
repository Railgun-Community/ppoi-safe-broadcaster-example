import { Wallet } from '@ethersproject/wallet';
import {
  ERC20TransactionAction,
  generateProofTransaction,
  ProvedTransaction,
  setGasDetailsForPopulatedTransaction,
} from './client-railgun-transactions';
import { erc20NotesFromTokenAmounts } from './client-railgun-notes';
import { ERC20Transaction } from '@railgun-community/lepton';
import { TokenAmount } from '../../models/token-models';
import { NetworkChainID } from '../../server/config/config-chain-ids';
import { BytesData } from '@railgun-community/lepton/dist/utils/bytes';
import { TransactionGasDetails } from '../../server/fees/calculate-transaction-gas';
import { gasEstimate } from './client-railgun-gas';
import { getProviderForNetwork } from '../../server/providers/active-network-providers';
import { sanitizeError } from '../client-util/sanitize-error';
import { TransactionResponse } from '@ethersproject/providers';

let cachedProvedTransaction: Optional<ProvedTransaction>;

const setTransferAmounts = (
  erc20Transaction: ERC20Transaction,
  tokenAmount: TokenAmount,
  toWalletAddress: string,
) => {
  // Note: Can specify up to 2 outputs. (Different addresses w/ different token amounts).
  // This configuration only handles 1.
  erc20Transaction.outputs = erc20NotesFromTokenAmounts(
    [tokenAmount],
    toWalletAddress,
  );
};

const setWithdrawAmounts = (
  erc20Transaction: ERC20Transaction,
  tokenAmount: TokenAmount,
  toWalletAddress: string,
) => {
  erc20Transaction.setWithdraw(tokenAmount.amount.toHexString());
  erc20Transaction.withdrawAddress = toWalletAddress.replace('0x', '');
};

const proveTransaction = async (
  chainID: NetworkChainID,
  toWalletAddress: string,
  railWalletID: string,
  encryptionKey: BytesData,
  tokenAmounts: TokenAmount[],
  action: ERC20TransactionAction,
): Promise<ProvedTransaction> => {
  cachedProvedTransaction = undefined;
  try {
    const populatedTransaction = await generateProofTransaction(
      chainID,
      railWalletID,
      toWalletAddress,
      encryptionKey,
      tokenAmounts,
      action,
    );
    const provedTransaction = {
      populatedTransaction,
      railWalletID,
      toWalletAddress,
      tokenAmounts,
    };
    return provedTransaction;
  } catch (error) {
    throw sanitizeError(error);
  }
};

export const generateTransferProof = async (
  chainID: NetworkChainID,
  toWalletAddress: string,
  railWalletID: string,
  encryptionKey: BytesData,
  tokenAmounts: TokenAmount[],
): Promise<ProvedTransaction> => {
  return proveTransaction(
    chainID,
    toWalletAddress,
    railWalletID,
    encryptionKey,
    tokenAmounts,
    setTransferAmounts,
  );
};

export const executeWithdrawProof = async (
  chainID: NetworkChainID,
  toWalletAddress: string,
  railWalletID: string,
  encryptionKey: BytesData,
  tokenAmounts: TokenAmount[],
): Promise<ProvedTransaction> => {
  return proveTransaction(
    chainID,
    toWalletAddress,
    railWalletID,
    encryptionKey,
    tokenAmounts,
    setWithdrawAmounts,
  );
};

export const executeProvedTransfer = async (
  provedTransaction: ProvedTransaction,
  pKey: string,
  chainID: NetworkChainID,
  gasDetails: TransactionGasDetails,
): Promise<TransactionResponse> => {
  // NOTE: This is used for both withdraws and sends.
  try {
    const provider = getProviderForNetwork(chainID);
    const populatedTransaction = provedTransaction.populatedTransaction;

    setGasDetailsForPopulatedTransaction(populatedTransaction, gasDetails);

    const ethersWallet = new Wallet(pKey, provider);
    const txResponse = await ethersWallet.sendTransaction(populatedTransaction);
    return txResponse;
  } catch (error) {
    throw sanitizeError(error);
  }
};

export const gasEstimateForProvedTransfer = async (
  provedTransaction: ProvedTransaction,
  pKey: string,
  chainID: NetworkChainID,
): Promise<TransactionGasDetails> => {
  // NOTE: This is used for both withdraws and sends.
  try {
    const provider = getProviderForNetwork(chainID);
    const populatedTransaction = provedTransaction.populatedTransaction;

    const ethersWallet = new Wallet(pKey, provider);
    return gasEstimate(populatedTransaction, ethersWallet);
  } catch (error) {
    throw sanitizeError(error);
  }
};
