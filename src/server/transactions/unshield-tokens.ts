import {
  populateProvedUnshield,
  generateUnshieldProof,
  gasEstimateForUnprovenUnshield,
} from '@railgun-community/wallet';
import {
  getEVMGasTypeForTransaction,
  networkForChain,
  RailgunERC20AmountRecipient,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import { RelayerChain } from '../../models/chain-models';
import { ERC20Amount } from '../../models/token-models';
import { getStandardGasDetails } from '../fees/gas-by-speed';
import { getEstimateGasDetailsPublic } from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { ContractTransaction, TransactionResponse } from 'ethers';

export const generateUnshieldTransaction = async (
  railgunWalletID: string,
  dbEncryptionKey: string,
  toWalletAddress: string,
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
): Promise<ContractTransaction> => {
  const network = networkForChain(chain);
  if (!network) {
    throw new Error(`Unsupported network for chain ${chain.type}:${chain.id}`);
  }
  const sendWithPublicWallet = true;
  const evmGasType = getEVMGasTypeForTransaction(
    network.name,
    sendWithPublicWallet,
  );

  const erc20AmountRecipients: RailgunERC20AmountRecipient[] = erc20Amounts.map(
    (erc20Amount) => ({
      tokenAddress: erc20Amount.tokenAddress,
      amount: erc20Amount.amount,
      recipientAddress: toWalletAddress,
    }),
  );

  const standardGasDetails = await getStandardGasDetails(evmGasType, chain);
  const originalGasDetails: TransactionGasDetails = {
    ...standardGasDetails,
    gasEstimate: 0n,
  };

  const { gasEstimate } = await gasEstimateForUnprovenUnshield(
    network.name,
    railgunWalletID,
    dbEncryptionKey,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    originalGasDetails,
    undefined, // feeTokenDetails
    sendWithPublicWallet,
  );

  await generateUnshieldProof(
    network.name,
    railgunWalletID,
    dbEncryptionKey,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    undefined, // relayerFeeERC20AmountRecipient
    sendWithPublicWallet,
    undefined, // overallBatchMinGasPrice
    () => {}, // progressCallback
  );

  const finalGasDetails: TransactionGasDetails = {
    ...originalGasDetails,
    gasEstimate,
  };
  const { transaction } = await populateProvedUnshield(
    network.name,
    railgunWalletID,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    undefined, // relayerFeeERC20AmountRecipient
    true, // sendWithPublicWallet
    undefined, // overallBatchMinGasPrice
    finalGasDetails,
  );
  return transaction;
};

export const unshieldTokens = async (
  railgunWalletID: string,
  dbEncryptionKey: string,
  toWalletAddress: string,
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
): Promise<TransactionResponse> => {
  const network = networkForChain(chain);
  if (!network) {
    throw new Error(`Unsupported network for chain ${chain.type}:${chain.id}`);
  }
  const sendWithPublicWallet = true;
  const evmGasType = getEVMGasTypeForTransaction(
    network.name,
    sendWithPublicWallet,
  );

  const populatedTransaction = await generateUnshieldTransaction(
    railgunWalletID,
    dbEncryptionKey,
    toWalletAddress,
    erc20Amounts,
    chain,
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
