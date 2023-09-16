import {
  ChainType,
  calculateGasPrice,
  EVMGasType,
  TransactionGasDetails,
  isDefined,
} from '@railgun-community/shared-models';
import { RelayerChain } from '../../models/chain-models';
import { ErrorMessage, sanitizeRelayerError } from '../../util/errors';
import { logger } from '../../util/logger';
import { throwErr, delay, promiseTimeout } from '../../util/promise-utils';
import { NetworkChainID } from '../config/config-chains';
import {
  getFirstJsonRpcProviderForNetwork,
  getProviderForNetwork,
} from '../providers/active-network-providers';
import { getStandardGasDetails } from './gas-by-speed';
import configDefaults from '../config/config-defaults';
import {
  ContractTransaction,
  formatEther,
  parseUnits,
  formatUnits,
} from 'ethers';
import debug from 'debug';

const dbg = debug('relayer:gas-estimate');

export const getEstimateGasDetailsPublic = async (
  chain: RelayerChain,
  evmGasType: EVMGasType,
  transaction: ContractTransaction,
  devLog?: boolean,
): Promise<TransactionGasDetails> => {
  try {
    dbg('Getting Public Gas Details');
    const gasDetails = await promiseTimeout(
      getStandardGasDetails(evmGasType, chain),
      30 * 1000,
    );

    const gasEstimate = await raceGasEstimate(chain, transaction).catch(
      throwErr,
    );

    return { gasEstimate, ...gasDetails };
  } catch (err) {
    logger.error(err);
    if (devLog ?? false) {
      throw sanitizeRelayerError(err);
    }
    throw new Error(ErrorMessage.GAS_ESTIMATE_ERROR);
  }
};

const raceGasEstimate = async (
  chain: RelayerChain,
  transaction: ContractTransaction,
): Promise<bigint> => {
  const provider1 = getProviderForNetwork(chain);
  const provider2 = getFirstJsonRpcProviderForNetwork(chain, true);

  const gasEstimate1 = promiseTimeout(
    provider1.estimateGas(transaction),
    30 * 1000,
  ).catch(throwErr);
  const gasEstimate2 = promiseTimeout(
    provider2.estimateGas(transaction),
    30 * 1000,
  ).catch(throwErr);

  return Promise.race([gasEstimate1, gasEstimate2])
    .then((result) => result as bigint)
    .catch((err) => {
      throw err;
    });
};

const sanitizeEthersError = (error: any) => {
  const patterns = [
    /gasFeeCap: (\d+) baseFee: (\d+)/,
    /maxFeePerGas: (\d+) baseFee: (\d+)/,
  ];
  if (
    isDefined(error.info) &&
    isDefined(error.info.error) &&
    isDefined(error.info.error.message)
  ) {
    for (const pattern of patterns) {
      const match = error.info.error.message.match(pattern);
      if (isDefined(match)) {
        const minGasPrice = match[1];
        const baseFeePerGas = match[2];
        return {
          minGasPrice,
          baseFeePerGas,
        };
      }
    }
  }

  return undefined;
};

export const getEstimateGasDetailsRelayed = async (
  chain: RelayerChain,
  evmGasType: EVMGasType,
  minGasPrice: bigint,
  transaction: ContractTransaction,
  devLog?: boolean,
  retryCount = 1,
): Promise<TransactionGasDetails> => {
  if (evmGasType === EVMGasType.Type2) {
    // minGasPrice not allowed on EVMGasType 2
    throw new Error('EVMGasType 2 not allowed for Relayer transactions.');
  }
  const gasPrice = minGasPrice;
  const transactionWithOptionalMinGas: ContractTransaction = {
    ...transaction,
    gasPrice,
  };

  const provider = getProviderForNetwork(chain);
  logger.warn('Running Gas Estimation'); // add this for proper timing logs in debug
  try {
    const gasEstimate = await promiseTimeout(
      provider.estimateGas(transactionWithOptionalMinGas),
      60 * 1000,
    ).catch(throwErr);
    logger.warn('Finished Gas Estimation'); // add this for proper timing logs in debug

    return { evmGasType, gasEstimate, gasPrice };
  } catch (err) {
    dbg('Gas Estimate Error');
    dbg('Action', err.action);
    dbg('Transaction Info', err.transaction);
    dbg('Error Info', err.info);
    const ethersError = sanitizeEthersError(err);

    if (isDefined(ethersError)) {
      dbg('Found Ethers Error.');
      const formattedProvidedGas = parseFloat(
        formatUnits(ethersError.minGasPrice, 'gwei'),
      ).toFixed(2);
      const formattedBaseFeeGas = parseFloat(
        formatUnits(ethersError.baseFeePerGas, 'gwei'),
      ).toFixed(8);
      const newErrorMessage = `CMsg_ERROR: Supplied Gas Price ${formattedProvidedGas} is below the current blocks base fee. The Suggested Gas Price was ${formattedBaseFeeGas}. The transaction was rejected by the RPC Network. Please try again with a higher gas price.`;
      throw new Error(newErrorMessage);
    }

    if (
      err.message.indexOf('Timed out') !== -1 ||
      err.message.indexOf('quorum not met') !== -1 ||
      err.message.indexOf('max fee per gas less than block base fee') !== -1
    ) {
      logger.warn('Experienced a quorum error. Trying again in a few seconds.');

      const { failedGasEstimateDelay, failedRetryAttempts } =
        configDefaults.gasEstimateSettings;

      await delay(failedGasEstimateDelay);

      if (retryCount >= failedRetryAttempts) {
        if (err.message.indexOf('Timed out') !== -1) {
          throw new Error(
            `CMsg_ERROR: Relayer timed out attempting gas estimation. Please try again.`,
          );
        }
      }
      return getEstimateGasDetailsRelayed(
        chain,
        evmGasType,
        minGasPrice,
        transaction,
        devLog,
        retryCount + 1,
      );
    }
    if (err.message.indexOf('Note already spent') !== -1) {
      throw new Error(ErrorMessage.NOTE_ALREADY_SPENT);
    }
    if (devLog ?? false) {
      throw sanitizeRelayerError(err);
    }

    if (err.message.indexOf('missing revert data') !== -1) {
      dbg('Missing Revert Data', retryCount);

      const { failedGasEstimateDelay, failedRetryAttempts } =
        configDefaults.gasEstimateSettings;
      await delay(failedGasEstimateDelay);

      if (retryCount <= failedRetryAttempts + 4) {
        return getEstimateGasDetailsRelayed(
          chain,
          evmGasType,
          minGasPrice,
          transaction,
          devLog,
          retryCount + 1,
        );
      }

      throw new Error(ErrorMessage.GAS_ESTIMATE_REVERT);
    }
    throw new Error(ErrorMessage.GAS_ESTIMATE_ERROR);
  }
};

export const calculateGasLimitRelayer = (
  gasEstimate: bigint,
  chain: RelayerChain,
): bigint => {
  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Arbitrum:
        case NetworkChainID.ArbitrumGoerli:
          // Add 30% to gasEstimate for L2s.
          return (gasEstimate * 13000n) / 10000n;
        case NetworkChainID.EthereumGoerli:
        case NetworkChainID.BNBChain:
        case NetworkChainID.PolygonPOS:
        case NetworkChainID.Hardhat:
        case NetworkChainID.PolygonMumbai:
        case NetworkChainID.Ethereum:
          // Add 20% to gasEstimate for L1s.
          return (gasEstimate * 12000n) / 10000n;
      }
    }
  }
};

export const calculateMaximumGasRelayer = (
  transactionGasDetails: TransactionGasDetails,
  chain: RelayerChain,
): bigint => {
  const gasPrice = calculateGasPrice(transactionGasDetails);
  const { gasEstimate } = transactionGasDetails;
  return calculateGasLimitRelayer(gasEstimate, chain) * gasPrice;
};

export const calculateMaximumGasPublic = (
  transactionGasDetails: TransactionGasDetails,
): bigint => {
  const gasPrice = calculateGasPrice(transactionGasDetails);
  const { gasEstimate } = transactionGasDetails;
  const publicGasEstimate = gasEstimate * gasPrice;
  // Average gas usage is around 83% of the max estimate.
  logger.warn(
    `Gas Price Estimated at: ${formatEther(
      parseUnits(gasPrice.toString(), 'gwei'),
    )}`,
  );
  return (publicGasEstimate * 8350n) / 10000n;
};
