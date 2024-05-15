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
import { BroadcasterChain } from '../../models/chain-models';
import {
  delay,
  getEVMGasTypeForTransaction,
  isDefined,
  networkForChain,
} from '@railgun-community/shared-models';
import { ContractTransaction, TransactionResponse } from 'ethers';

const dbg = debug('broadcaster:swaps');

export const generateSwapTransactions = async (
  erc20Amounts: ERC20Amount[],
  chain: BroadcasterChain,
  walletAddress: string,
): Promise<ContractTransaction[]> => {
  const populatedTransactions: Optional<ContractTransaction>[] = [];
  for (const erc20Amount of erc20Amounts) {
    try {
      const { gasToken, topUp } = configNetworks[chain.type][chain.id];

      // eslint-disable-next-line no-await-in-loop
      const swapQuote = await zeroXGetSwapQuote(
        chain,
        erc20Amount,
        gasToken.symbol,
        topUp.toleratedSlippage,
      );
      if (isDefined(swapQuote.error)) {
        throw new Error(swapQuote.error);
      }
      if (!swapQuote.quote) {
        dbg(`Failed to get zeroX Swap Quote for ${erc20Amount.tokenAddress}`);
        continue;
      }
      const populatedSwap = quoteToContractTransaction(
        chain,
        swapQuote.quote,
        walletAddress,
      );
      populatedTransactions.push(populatedSwap);
    } catch (err) {
      dbg(
        `Could not populate transaction for token ${erc20Amount.tokenAddress} being swapped for top up: ${err.message}`,
      );
      continue;
    }
  }
  await Promise.all(populatedTransactions);

  return removeUndefineds(populatedTransactions);
};

const quoteToContractTransaction = (
  chain: BroadcasterChain,
  quote: ZeroXFormattedQuoteData,
  walletAddress: string,
): ContractTransaction => {
  const populatedTransaction: ContractTransaction = {
    to: zeroXExchangeProxyContractAddress(chain),
    from: walletAddress,
    data: quote.data,
    value: BigInt(quote.value),
  };
  return populatedTransaction;
};

export const swapZeroX = async (
  activeWallet: ActiveWallet,
  erc20Amounts: ERC20Amount[],
  chain: BroadcasterChain,
): Promise<TransactionResponse[]> => {
  const populatedSwapTXs = await generateSwapTransactions(
    erc20Amounts,
    chain,
    activeWallet.address,
  );
  const TransactionResponses: TransactionResponse[] = [];
  const network = networkForChain(chain);
  for (const populatedSwap of populatedSwapTXs) {
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
    // eslint-disable-next-line no-await-in-loop
    const gasDetails = await getEstimateGasDetailsPublic(
      chain,
      evmGasType,
      populatedSwap,
    );
    // eslint-disable-next-line no-await-in-loop
    const txResponse = await executeTransaction(
      chain,
      populatedSwap,
      gasDetails,
      undefined, // txidVersion
      undefined, // validatedPOIData
      activeWallet,
      undefined, // overrideNonce
      false, // setAvailability
      false, // setTxCached
    );
    TransactionResponses.push(txResponse);
    // eslint-disable-next-line no-await-in-loop
    await delay(2 * 1000);
  }

  return TransactionResponses;
};
