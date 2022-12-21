import { TransactionRequest } from '@ethersproject/providers';
import {
  calculateGasPrice,
  EVMGasType,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import { BigNumber } from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { ErrorMessage, sanitizeRelayerError } from '../../util/errors';
import { logger } from '../../util/logger';
import { throwErr } from '../../util/promise-utils';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getStandardGasDetails } from './gas-by-speed';

export const getEstimateGasDetailsPublic = async (
  chain: RelayerChain,
  evmGasType: EVMGasType,
  transactionRequest: TransactionRequest,
  devLog?: boolean,
): Promise<TransactionGasDetails> => {
  try {
    const provider = getProviderForNetwork(chain);
    const [gasEstimate, gasDetails] = await Promise.all([
      provider.estimateGas(transactionRequest).catch(throwErr),
      getStandardGasDetails(evmGasType, chain),
    ]);

    return { gasEstimate, ...gasDetails };
  } catch (err) {
    logger.error(err);
    if (devLog) {
      throw sanitizeRelayerError(err);
    }
    throw new Error(ErrorMessage.GAS_ESTIMATE_ERROR);
  }
};

export const getEstimateGasDetailsRelayed = async (
  chain: RelayerChain,
  evmGasType: EVMGasType,
  minGasPrice: string,
  transactionRequest: TransactionRequest,
  devLog?: boolean,
): Promise<TransactionGasDetails> => {
  if (evmGasType === EVMGasType.Type2) {
    // minGasPrice not allowed on EVMGasType 2
    throw new Error('EVMGasType 2 not allowed for Relayer transactions.');
  }
  try {
    const gasPrice = BigNumber.from(minGasPrice);
    const transactionRequestWithOptionalMinGas: TransactionRequest = {
      ...transactionRequest,
      gasPrice: 1000000000000,
    };

    const provider = getProviderForNetwork(chain);
    const gasEstimate = await provider
      .estimateGas(transactionRequestWithOptionalMinGas)
      .catch(throwErr);

    return { evmGasType, gasEstimate, gasPrice };
  } catch (err) {
    logger.error(err);
    if (devLog) {
      throw sanitizeRelayerError(err);
    }
    throw new Error(ErrorMessage.GAS_ESTIMATE_ERROR);
  }
};

export const calculateGasLimitRelayer = (gasEstimate: BigNumber): BigNumber => {
  // Add 20% to gasEstimate * gasPrice.
  return gasEstimate.mul(12000).div(10000);
};

export const calculateMaximumGasRelayer = (
  transactionGasDetails: TransactionGasDetails,
): BigNumber => {
  const gasPrice = calculateGasPrice(transactionGasDetails);
  const { gasEstimate } = transactionGasDetails;
  return calculateGasLimitRelayer(gasEstimate).mul(gasPrice);
};
