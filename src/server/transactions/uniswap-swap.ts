import {
  delay,
  getEVMGasTypeForTransaction,
  isDefined,
  networkForChain,
  removeUndefineds,
} from '@railgun-community/shared-models';
import configNetworks from '../config/config-networks';
import { ContractTransaction, TransactionResponse } from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { ERC20Amount } from '../../models/token-models';
import debug from 'debug';
import { uniswapGetSwapQuote } from '../api/uniswap/uniswap-quote';
import { UniswapQuoteData } from '../api/uniswap/uniswap-models';
import { ActiveWallet } from '../../models/wallet-models';
import { getEstimateGasDetailsPublic } from '../fees/gas-estimate';
import { executeTransaction, waitTx } from './execute-transaction';
import { populateUniswapApprovalTransactions } from './uniswap-approve';
import { getProviderForNetwork } from '../providers/active-network-providers';

const dbg = debug('broadcaster:uni-swaps');

const quoteToContractTransaction = (
  chain: RelayerChain,
  quote: UniswapQuoteData,
  walletAddress: string,
): ContractTransaction => {
  const populatedTransaction: ContractTransaction = {
    to: quote.methodParameters.to,
    from: walletAddress,
    data: quote.methodParameters.calldata,
    value: BigInt(quote.methodParameters.value),
  };
  // console.log(populatedTransaction);
  return populatedTransaction;
};

export const generateUniSwapTransactions = async (
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
  walletAddress: string,
): Promise<ContractTransaction[]> => {
  const populatedTransactions: Optional<ContractTransaction>[] = [];
  const provider = getProviderForNetwork(chain);

  for (const erc20Amount of erc20Amounts) {
    try {
      const { gasToken, topUp } = configNetworks[chain.type][chain.id];

      // eslint-disable-next-line no-await-in-loop
      const swapQuote = await uniswapGetSwapQuote(
        chain,
        walletAddress,
        erc20Amount,
        gasToken.wrappedAddress,
        topUp.toleratedSlippage,
      );

      if (isDefined(swapQuote.error)) {
        throw new Error(swapQuote.error);
      }
      if (!swapQuote.quote) {
        dbg(`Failed to get Uniswap Quote for ${erc20Amount.tokenAddress}`);
        continue;
      }

      const spender = swapQuote.quote.methodParameters.to;

      // eslint-disable-next-line no-await-in-loop
      const populatedApprovals = await populateUniswapApprovalTransactions(
        erc20Amount,
        provider,
        chain,
        walletAddress,
        spender,
      );

      populatedTransactions.push(...populatedApprovals);
      const populatedSwap = quoteToContractTransaction(
        chain,
        swapQuote.quote,
        walletAddress,
      );
      if (populatedSwap.data === undefined) {
        throw new Error('populatedSwap.data is undefined');
      }
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

export const swapUniswap = async (
  activeWallet: ActiveWallet,
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
): Promise<TransactionResponse[]> => {
  const populatedSwapTXs = await generateUniSwapTransactions(
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
    // eslint-disable-next-line no-await-in-loop
    await waitTx(txResponse);
    TransactionResponses.push(txResponse);
  }

  return TransactionResponses;
};
