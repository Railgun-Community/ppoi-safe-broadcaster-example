import { TransactionRequest } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { EVMGasType } from '../../models/network-models';
import { ErrorMessage } from '../../util/errors';
import { logger } from '../../util/logger';
import { throwErr } from '../../util/promise-utils';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { GasDetails, getStandardGasDetails } from './gas-by-speed';

export type TransactionGasDetails =
  | TransactionGasDetailsType0
  | TransactionGasDetailsType2;

export type TransactionGasDetailsType0 = {
  evmGasType: EVMGasType.Type0;
  gasEstimate: BigNumber;
  gasPrice: BigNumber;
};

export type TransactionGasDetailsType2 = {
  evmGasType: EVMGasType.Type2;
  gasEstimate: BigNumber;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
};

export const getEstimateGasDetails = async (
  chain: RelayerChain,
  minGasPrice: Optional<string>,
  transactionRequest: TransactionRequest,
  devLog?: boolean,
): Promise<TransactionGasDetails> => {
  try {
    const provider = getProviderForNetwork(chain);
    const [gasEstimate, gasDetailsBySpeed] = await Promise.all([
      provider.estimateGas(transactionRequest).catch(throwErr),
      getGasPriceDetails(minGasPrice, chain),
    ]);

    return { gasEstimate, ...gasDetailsBySpeed };
  } catch (err) {
    logger.error(err);
    if (devLog) {
      throw new Error(err);
    }
    throw new Error(ErrorMessage.GAS_ESTIMATE_ERROR);
  }
};

const getGasPriceDetails = (
  minGasPrice: Optional<string>,
  chain: RelayerChain,
): Promise<GasDetails> => {
  if (minGasPrice) {
    // MinGasPrice is only Type0.
    return Promise.resolve({
      evmGasType: EVMGasType.Type0,
      gasPrice: BigNumber.from(minGasPrice),
    });
  }
  return getStandardGasDetails(chain);
};

export const calculateGasLimit = (gasEstimate: BigNumber): BigNumber => {
  // Gas Limit: Note that we add 20% to gas estimate on the client side.
  // return gasEstimate.mul(12000).div(10000);
  // On Relayer side, we don't add anything.
  return gasEstimate;
};

const getGasPrice = (gasDetails: TransactionGasDetails) => {
  switch (gasDetails.evmGasType) {
    case EVMGasType.Type0: {
      return gasDetails.gasPrice;
    }
    case EVMGasType.Type2: {
      const { maxFeePerGas } = gasDetails;
      return maxFeePerGas;
    }
  }
  throw new Error('Unrecognized gas type.');
};

export const calculateTotalGas = (
  transactionGasDetails: TransactionGasDetails,
) => {
  const gasPrice = getGasPrice(transactionGasDetails);
  const { gasEstimate } = transactionGasDetails;
  return gasEstimate.mul(gasPrice);
};

export const calculateMaximumGas = (
  transactionGasDetails: TransactionGasDetails,
): BigNumber => {
  const gasPrice = getGasPrice(transactionGasDetails);
  const { gasEstimate } = transactionGasDetails;
  return calculateGasLimit(gasEstimate).mul(gasPrice);
};
