import { TransactionResponse } from '@ethersproject/providers';
import {
  populateProvedUnshield,
  generateUnshieldProof,
  gasEstimateForUnprovenUnshield,
} from '@railgun-community/quickstart';
import {
  deserializeTransaction,
  getEVMGasTypeForTransaction,
  networkForChain,
  RailgunERC20AmountRecipient,
  serializeTransactionGasDetails,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import { BigNumber } from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { TokenAmount } from '../../models/token-models';
import { getStandardGasDetails } from '../fees/gas-by-speed';
import { getEstimateGasDetailsPublic } from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';

export const generateUnshieldTransaction = async (
  railgunWalletID: string,
  dbEncryptionKey: string,
  toWalletAddress: string,
  erc20Amounts: TokenAmount[],
  chain: RelayerChain,
) => {
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
      amountString: erc20Amount.amount.toHexString(),
      recipientAddress: toWalletAddress,
    }),
  );

  const standardGasDetails = await getStandardGasDetails(evmGasType, chain);
  const originalGasDetails: TransactionGasDetails = {
    ...standardGasDetails,
    gasEstimate: BigNumber.from(0),
  };
  const originalGasDetailsSerialized =
    serializeTransactionGasDetails(originalGasDetails);

  const { gasEstimateString } = await gasEstimateForUnprovenUnshield(
    network.name,
    railgunWalletID,
    dbEncryptionKey,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    originalGasDetailsSerialized,
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
    gasEstimate: BigNumber.from(gasEstimateString),
  };
  const finalGasDetailsSerialized =
    serializeTransactionGasDetails(finalGasDetails);

  const { serializedTransaction } = await populateProvedUnshield(
    network.name,
    railgunWalletID,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    undefined, // relayerFeeERC20AmountRecipient
    true, // sendWithPublicWallet
    undefined, // overallBatchMinGasPrice
    finalGasDetailsSerialized,
  );
  const populatedTransaction = deserializeTransaction(
    serializedTransaction,
    undefined, // nonce
    network.chain.id,
  );
  return populatedTransaction;
};

export const unshieldTokens = async (
  railgunWalletID: string,
  dbEncryptionKey: string,
  toWalletAddress: string,
  erc20Amounts: TokenAmount[],
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
