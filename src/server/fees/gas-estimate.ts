import { BigNumber, PopulatedTransaction } from 'ethers';
import { EVMGasType } from '../../models/network-models';
import { throwErr } from '../../util/promise-utils';
import { NetworkChainID } from '../config/config-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { BAD_TOKEN_FEE_ERROR_MESSAGE } from './fee-validator';
import { getStandardHistoricalFeeData } from './gas-history';

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
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
): Promise<TransactionGasDetails> => {
  const provider = getProviderForNetwork(chainID);
  const [gasEstimate, feeData] = await Promise.all([
    provider.estimateGas(populatedTransaction).catch(throwErr),
    getStandardHistoricalFeeData(chainID),
  ]);

  return { gasEstimate, ...feeData };
};

export const calculateGasLimit = (gasEstimate: BigNumber): BigNumber => {
  // Gas Limit: Add 20% to gas estimate.
  return gasEstimate.mul(12000).div(10000);
};

const calculateGasPrice = (gasDetails: TransactionGasDetails) => {
  switch (gasDetails.evmGasType) {
    case EVMGasType.Type0: {
      return gasDetails.gasPrice;
    }
    case EVMGasType.Type2: {
      const { maxFeePerGas, maxPriorityFeePerGas } = gasDetails;
      return maxFeePerGas.add(maxPriorityFeePerGas);
    }
  }
  throw new Error('Unrecognized gas type.');
};

export const calculateTotalGas = (
  transactionGasDetails: TransactionGasDetails,
) => {
  const gasPrice = calculateGasPrice(transactionGasDetails);
  const { gasEstimate } = transactionGasDetails;
  return gasEstimate.mul(gasPrice);
};

export const calculateMaximumGas = (
  transactionGasDetails: TransactionGasDetails,
): BigNumber => {
  const gasPrice = calculateGasPrice(transactionGasDetails);
  const { gasEstimate } = transactionGasDetails;
  return calculateGasLimit(gasEstimate).mul(gasPrice);
};
