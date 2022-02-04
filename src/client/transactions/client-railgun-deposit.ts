import { Wallet } from '@ethersproject/wallet';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { setGasDetailsForPopulatedTransaction } from './client-railgun-transactions';
import { NetworkChainID } from '../../server/config/config-chain-ids';
import { TokenAmount } from '../../models/token-models';
import { TransactionGasDetails } from '../../server/fees/calculate-transaction-gas';
import { getContractForNetwork } from './client-railgun-contract';
import { erc20NotesFromTokenAmounts } from './client-railgun-notes';
import { sanitizeError } from '../client-util/sanitize-error';
import { getProviderForNetwork } from '../../server/providers/active-network-providers';
import { gasEstimate } from './client-railgun-gas';
import { TransactionResponse } from '@ethersproject/providers';

const generateDepositTransaction = async (
  chainID: NetworkChainID,
  railAddress: string,
  tokenAmounts: TokenAmount[],
): Promise<PopulatedTransaction> => {
  try {
    const railContract = getContractForNetwork(chainID);
    const notes: any[] = erc20NotesFromTokenAmounts(tokenAmounts, railAddress);

    const populatedTransaction = await railContract.generateDeposit(notes);
    return populatedTransaction;
  } catch (error) {
    throw sanitizeError(error);
  }
};

export const executeDeposit = async (
  pKey: string,
  chainID: NetworkChainID,
  toWalletAddress: string,
  tokenAmounts: TokenAmount[],
  gasDetails: TransactionGasDetails,
): Promise<TransactionResponse> => {
  try {
    const railAddress = toWalletAddress;
    const populatedTransaction = await generateDepositTransaction(
      chainID,
      railAddress,
      tokenAmounts,
    );

    setGasDetailsForPopulatedTransaction(populatedTransaction, gasDetails);

    const provider = getProviderForNetwork(chainID);
    const ethersWallet = new Wallet(pKey, provider);
    const txResponse = await ethersWallet.sendTransaction(populatedTransaction);
    return txResponse;
  } catch (error) {
    throw sanitizeError(error);
  }
};

export const gasEstimateForDeposit = async (
  pKey: string,
  chainID: NetworkChainID,
  toWalletAddress: string,
  tokenAmounts: TokenAmount[],
): Promise<TransactionGasDetails> => {
  try {
    const railAddress = toWalletAddress;
    const populatedTransaction = await generateDepositTransaction(
      chainID,
      railAddress,
      tokenAmounts,
    );

    const provider = getProviderForNetwork(chainID);
    const ethersWallet = new Wallet(pKey, provider);
    return gasEstimate(populatedTransaction, ethersWallet);
  } catch (error) {
    throw sanitizeError(error);
  }
};
