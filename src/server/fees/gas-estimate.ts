import { BaseProvider } from '@ethersproject/providers';
import { BigNumber, PopulatedTransaction } from 'ethers';
import { throwErr } from '../../util/promise-utils';
import { NetworkChainID } from '../config/config-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { BAD_TOKEN_FEE_ERROR_MESSAGE } from './fee-validator';

export type TransactionGasDetails = {
  gasEstimate: BigNumber;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
};

export const getEstimateGasDetails = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
): Promise<TransactionGasDetails> => {
  try {
    const provider = getProviderForNetwork(chainID);
    const [gasEstimate, { maxFeePerGas, maxPriorityFeePerGas }] =
      await Promise.all([
        provider.estimateGas(populatedTransaction).catch(throwErr),
        getProviderFeeData(provider),
      ]);
    return { gasEstimate, maxFeePerGas, maxPriorityFeePerGas };
  } catch (err) {
    if (err.message && err.message.includes('failed to meet quorum')) {
      throw new Error(BAD_TOKEN_FEE_ERROR_MESSAGE);
    }
    throw err;
  }
};

export const getProviderFeeData = async (
  provider: BaseProvider,
): Promise<{
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
}> => {
  const { maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData();
  if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
    throw new Error('Could not fetch fee data for this transaction.');
  }
  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
};

export const calculateGasLimit = (gasEstimate: BigNumber): BigNumber => {
  // Gas Limit: Add 20% to gas estimate.
  return gasEstimate.mul(12000).div(10000);
};

export const calculateGasPrice = ({
  maxFeePerGas,
  maxPriorityFeePerGas,
}: TransactionGasDetails) => {
  return maxFeePerGas.add(maxPriorityFeePerGas);
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
