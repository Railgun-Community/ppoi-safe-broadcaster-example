import {
  populateProvedUnshield,
  generateUnshieldProof,
  gasEstimateForUnprovenUnshield,
  rescanFullMerkletreesAndWallets,
} from '@railgun-community/wallet';
import {
  getEVMGasTypeForTransaction,
  isDefined,
  networkForChain,
  promiseTimeout,
  RailgunERC20AmountRecipient,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import { RelayerChain } from '../../models/chain-models';
import { ERC20Amount } from '../../models/token-models';
import { getStandardGasDetails } from '../fees/gas-by-speed';
import {
  calculateMaximumGasPublic,
  getEstimateGasDetailsPublic,
} from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { getTokenPricesFromCachedPrices } from '../fees/calculate-token-fee';
import { logger } from '../../util/logger';
import { getTransactionTokens } from '../tokens/network-tokens';
import {
  cacheTopUpTransaction,
  getCachedTransaction,
} from '../fees/gas-price-cache';
import configNetworks from '../config/config-networks';

import { getBestMatchWalletForNetwork } from '../wallets/best-match-wallet';
import { TransactionResponse, ContractTransaction, formatUnits } from 'ethers';
import debug from 'debug';
import { delay } from '../../util/promise-utils';

const dbg = debug('relayer:top-up-unshield');

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

  logger.warn('Getting standard gas details for unshield.');

  const standardGasDetails = await promiseTimeout(
    getStandardGasDetails(evmGasType, chain),
    5 * 60 * 1000,
  ).catch(() => {
    return undefined;
  });

  if (!isDefined(standardGasDetails)) {
    throw new Error(
      `Unshield gas estimate: Unable to get Standard Gas Details`,
    );
  }

  const originalGasDetails: TransactionGasDetails = {
    ...standardGasDetails,
    gasEstimate: 0n,
  };

  logger.warn('Getting gas estimate for unshield.');

  const unshieldEstimateTimeout = 5 * 60 * 1000;

  const { gasEstimate } = await promiseTimeout(
    gasEstimateForUnprovenUnshield(
      network.name,
      railgunWalletID,
      dbEncryptionKey,
      erc20AmountRecipients,
      [], // nftAmountRecipients
      originalGasDetails,
      undefined, // feeTokenDetails
      sendWithPublicWallet,
    ),
    unshieldEstimateTimeout,
  ).catch(async (err) => {
    dbg('Unshield Gas Error:', err.message);
    if (err.message.includes('Invalid Merkle Root') === true) {
      dbg('SYNC ERROR: Invalid Merkle Root');
      await rescanFullMerkletreesAndWallets(chain);
      dbg('Merkle Rescan Complete.');
    }
    return { gasEstimate: undefined };
  });

  if (!isDefined(gasEstimate)) {
    throw new Error(`Unshield gas estimate: No gas estimate returned`);
  }
  dbg('Generating Proof for unshield.');

  await generateUnshieldProof(
    network.name,
    railgunWalletID,
    dbEncryptionKey,
    erc20AmountRecipients,
    [], // nftAmountRecipients
    undefined, // relayerFeeERC20AmountRecipient
    sendWithPublicWallet,
    undefined, // overallBatchMinGasPrice
    (progress: number) => {
      dbg(`Unshield Proof Progress:  ${progress.toFixed(2)}%`);
    }, // progressCallback
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
  // cache this transaction if we fail
  // erc20 swap to native value doesnt really matter/change too much to need to recalculate
  // will clear cache on timer? to adjust for above issue.
  // then we can skip directly to the gasEstimation jazz below.

  const cachedTransaction = getCachedTransaction(chain);
  let populatedTransaction: ContractTransaction;

  if (!cachedTransaction) {
    populatedTransaction = await generateUnshieldTransaction(
      railgunWalletID,
      dbEncryptionKey,
      toWalletAddress,
      erc20Amounts,
      chain,
    );
    cacheTopUpTransaction(chain, populatedTransaction);
  } else {
    populatedTransaction = cachedTransaction.tx;
    delete populatedTransaction.gasLimit;
    delete populatedTransaction.gasPrice;
    delete populatedTransaction.maxFeePerGas;
    delete populatedTransaction.maxPriorityFeePerGas;
  }

  const gasDetails = await promiseTimeout(
    getEstimateGasDetailsPublic(chain, evmGasType, populatedTransaction),
    1 * 60 * 1000,
  ).catch((err: Error) => {
    logger.warn(err.message);
    if (err.message.includes('Timed Out')) {
      return undefined;
    }
    if (
      err.message.indexOf(
        'cannot estimate gas; transaction may fail or may require manual gas limit',
      ) !== -1
    ) {
      throw err;
    }
    return undefined;
  });
  if (!isDefined(gasDetails)) {
    throw new Error('there was an error calculating gas details.');
  }
  logger.warn(`Gas details: ${formatUnits(gasDetails.gasEstimate, 'wei')}`);

  const maxGasCost = calculateMaximumGasPublic(gasDetails);

  await checkGasEstimate(erc20Amounts, chain, maxGasCost);
  const unshieldWallet = await getBestMatchWalletForNetwork(chain, maxGasCost);
  const batchResponse = await executeTransaction(
    chain,
    populatedTransaction,
    gasDetails,
    unshieldWallet,
  );

  return batchResponse;
};

const getMaxSpendPercentageForChain = (chain: RelayerChain): number => {
  return configNetworks[chain.type][chain.id].topUp.maxSpendPercentage;
};

const checkGasEstimate = async (
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
  maxGasCost: bigint,
) => {
  logger.warn('TOP UP GASTIMATOR');

  const maxSpendPercentage = getMaxSpendPercentageForChain(chain);
  let totalRecieved = 0;
  for (const erc20 of erc20Amounts) {
    const { tokenPrice, gasTokenPrice } = getTokenPricesFromCachedPrices(
      chain,
      erc20.tokenAddress,
    );

    const { token, gasToken } = getTransactionTokens(chain, erc20.tokenAddress);

    const tokenAmount = formatUnits(erc20.amount, token.decimals);
    if (erc20.tokenAddress === gasToken.wrappedAddress) {
      totalRecieved += parseFloat(tokenAmount);
    } else {
      const tokenValue = (parseFloat(tokenAmount) * tokenPrice) / gasTokenPrice;
      logger.warn(`Token is not Native  ${tokenValue}`);
      totalRecieved += tokenValue;
    }
  }
  const maxGasCostFormatted = parseFloat(formatUnits(maxGasCost, 18));
  const costPercentage = maxGasCostFormatted / totalRecieved;
  logger.warn(`totalRecieved:${totalRecieved?.toString()}`);
  logger.warn(`maxGasCost:${maxGasCost?.toString()}`);
  logger.warn(`maxGasCostFormatted:${maxGasCostFormatted?.toString()}`);
  logger.warn(`costPercentage:${costPercentage?.toString()}`);
  logger.warn(`costPercentage:${costPercentage * 100}`);
  if (costPercentage > maxSpendPercentage) {
    // if its too costly, cache the gas price for this chain, so we don't keep trying if the gas price is above this mark.
    throw new Error('Top Up too costly, skipping!');
  }
};
