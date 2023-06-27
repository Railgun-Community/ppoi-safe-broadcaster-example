import { ERC20Amount } from '../../models/token-models';
import {
  zeroXExchangeProxyContractAddress,
  ZeroXFormattedQuoteData,
  zeroXGetSwapQuote,
} from '../api/0x/0x-quote';
import { getEstimateGasDetailsPublic } from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { ActiveWallet } from '../../models/wallet-models';
import configNetworks from '../config/config-networks';
import debug from 'debug';
import { removeUndefineds } from '../../util/utils';
import { RelayerChain } from '../../models/chain-models';
import configDefaults from '../config/config-defaults';
import {
  getEVMGasTypeForTransaction,
  isDefined,
  networkForChain,
} from '@railgun-community/shared-models';
import { ContractTransaction, TransactionResponse } from 'ethers';

const dbg = debug('relayer:swaps');

export const generateSwapTransactions = async (
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
  shouldThrow = false,
): Promise<ContractTransaction[]> => {
  const populatedTransactions: Optional<ContractTransaction>[] =
    await Promise.all(
      erc20Amounts.map(async (erc20Amount) => {
        try {
          const swapQuote = await zeroXGetSwapQuote(
            chain,
            erc20Amount,
            configNetworks[chain.type][chain.id].gasToken.symbol,
            configDefaults.topUps.toleratedSlippage,
          );
          if (isDefined(swapQuote.error)) {
            throw new Error(swapQuote.error);
          }
          if (!swapQuote.quote) {
            const errMessage = `Failed to get zeroX Swap Quote for ${erc20Amount.tokenAddress}`;
            if (shouldThrow) {
              throw new Error(errMessage);
            }
            dbg(errMessage);
            return undefined;
          }
          const populatedSwap = quoteToContractTransaction(
            chain,
            swapQuote.quote,
          );
          return populatedSwap;
        } catch (err) {
          const errMessage = `Could not populate swap transaction (during top-up) for token ${erc20Amount.tokenAddress}: ${err.message}`;
          if (shouldThrow) {
            throw new Error(errMessage);
          }
          dbg(errMessage);
          return undefined;
        }
      }),
    );

  return removeUndefineds(populatedTransactions);
};

const quoteToContractTransaction = (
  chain: RelayerChain,
  quote: ZeroXFormattedQuoteData,
): ContractTransaction => {
  const populatedTransaction: ContractTransaction = {
    to: zeroXExchangeProxyContractAddress(chain),
    data: quote.data,
    value: BigInt(quote.value),
  };
  return populatedTransaction;
};

export const swapZeroX = async (
  activeWallet: ActiveWallet,
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
): Promise<TransactionResponse[]> => {
  const populatedSwapTXs = await generateSwapTransactions(erc20Amounts, chain);
  const TransactionResponses: TransactionResponse[] = await Promise.all(
    populatedSwapTXs.map(async (populatedSwap) => {
      const network = networkForChain(chain);
      if (!network) {
        throw new Error(
          `Unsupported network for chain ${chain.type}:${chain.id}`,
        );
      }
      const sendWithPublicWallet = true;
      const evmGasType = getEVMGasTypeForTransaction(
        network.name,
        sendWithPublicWallet,
      );
      const gasDetails = await getEstimateGasDetailsPublic(
        chain,
        evmGasType,
        populatedSwap,
      );
      const txResponse = await executeTransaction(
        chain,
        populatedSwap,
        gasDetails,
        activeWallet,
      );
      return txResponse;
    }),
  );

  return TransactionResponses;
};
