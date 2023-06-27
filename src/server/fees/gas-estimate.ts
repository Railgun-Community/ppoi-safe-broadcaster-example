import {
  ChainType,
  calculateGasPrice,
  EVMGasType,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import { RelayerChain } from '../../models/chain-models';
import { ErrorMessage, sanitizeRelayerError } from '../../util/errors';
import { logger } from '../../util/logger';
import { throwErr, delay } from '../../util/promise-utils';
import { NetworkChainID } from '../config/config-chains';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getStandardGasDetails } from './gas-by-speed';
import configDefaults from '../config/config-defaults';
import { ContractTransaction } from 'ethers';

export const getEstimateGasDetailsPublic = async (
  chain: RelayerChain,
  evmGasType: EVMGasType,
  transaction: ContractTransaction,
  devLog?: boolean,
): Promise<TransactionGasDetails> => {
  try {
    const provider = getProviderForNetwork(chain);
    const [gasEstimate, gasDetails] = await Promise.all([
      provider.estimateGas(transaction).catch(throwErr),
      getStandardGasDetails(evmGasType, chain),
    ]);

    return { gasEstimate, ...gasDetails };
  } catch (err) {
    logger.error(err);
    if (devLog ?? false) {
      throw sanitizeRelayerError(err);
    }
    throw new Error(ErrorMessage.GAS_ESTIMATE_ERROR);
  }
};

export const getEstimateGasDetailsRelayed = async (
  chain: RelayerChain,
  evmGasType: EVMGasType,
  minGasPrice: bigint,
  transaction: ContractTransaction,
  devLog?: boolean,
  retryCount = 0,
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

  try {
    const gasEstimate = await provider
      .estimateGas(transactionWithOptionalMinGas)
      .catch(throwErr);

    return { evmGasType, gasEstimate, gasPrice };
  } catch (err) {
    if (err.message.indexOf('failed to meet quorum') !== -1) {
      logger.warn('Experienced a quorum error. Trying again in a few seconds.');

      const { failedGasEstimateDelay, failedRetryAttempts } =
        configDefaults.gasEstimateSettings;

      await delay(failedGasEstimateDelay);
      if (retryCount > failedRetryAttempts) {
        throw new Error(ErrorMessage.FAILED_QUORUM);
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
    logger.error(err);
    if (devLog ?? false) {
      throw sanitizeRelayerError(err);
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
