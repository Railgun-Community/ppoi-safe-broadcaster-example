import { TransactionResponse } from '@ethersproject/providers';
import { BigNumber, PopulatedTransaction } from 'ethers';
import { TokenAmount } from '../../models/token-models';
import {
  zeroXExchangeProxyContractAddress,
  ZeroXFormattedQuoteData,
  zeroXGetSwapQuote,
} from '../api/0x/0x-quote';
import { NetworkChainID } from '../config/config-chain-ids';
import { getEstimateGasDetails } from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { ActiveWallet } from '../../models/wallet-models';
import configNetworks from '../config/config-networks';
import configWalletTopUpRefresher from '../config/config-wallet-top-up-refresher';
import debug from 'debug';
import { removeUndefineds } from '../../util/utils';

const dbg = debug('relayer:swaps');

export const generateSwapTransactions = async (
  tokenAmounts: TokenAmount[],
  chainID: NetworkChainID,
): Promise<PopulatedTransaction[]> => {
  const populatedTransactions: Optional<PopulatedTransaction>[] =
    await Promise.all(
      tokenAmounts.map(async (tokenAmount) => {
        try {
          const swapQuote = await zeroXGetSwapQuote(
            chainID,
            tokenAmount,
            configNetworks[chainID].gasToken.symbol,
            configWalletTopUpRefresher.toleratedSlippage,
          );
          if (!swapQuote.quote) {
            dbg(
              `Failed to get zeroX Swap Quote for ${tokenAmount.tokenAddress}`,
            );
            return undefined;
          }
          const populatedSwap = quoteToPopulatedTransaction(
            chainID,
            swapQuote.quote,
          );
          return populatedSwap;
        } catch (err: any) {
          dbg(
            `Could not populate transaction for some token being swapped for top up: ${err.message}`,
          );
          return undefined;
        }
      }),
    );

  return removeUndefineds(populatedTransactions);
};

const quoteToPopulatedTransaction = (
  chainID: NetworkChainID,
  quote: ZeroXFormattedQuoteData,
): PopulatedTransaction => {
  const populatedTransaction: PopulatedTransaction = {
    to: zeroXExchangeProxyContractAddress(chainID),
    data: quote.data,
    value: BigNumber.from(quote.value),
  };
  return populatedTransaction;
};

export const swapZeroX = async (
  activeWallet: ActiveWallet,
  tokenAmounts: TokenAmount[],
  chainID: NetworkChainID,
): Promise<TransactionResponse[]> => {
  const populatedSwapTXs = await generateSwapTransactions(
    tokenAmounts,
    chainID,
  );
  const TransactionResponses: TransactionResponse[] = await Promise.all(
    populatedSwapTXs.map(async (populatedSwap) => {
      const gasDetails = await getEstimateGasDetails(chainID, populatedSwap);
      const txResponse = await executeTransaction(
        chainID,
        populatedSwap,
        gasDetails,
        activeWallet,
      );
      return txResponse;
    }),
  );

  return TransactionResponses;
};
