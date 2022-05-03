import { BigNumber, PopulatedTransaction } from 'ethers';
import { throwErr } from '../../util/promise-utils';
import { NetworkChainID } from '../config/config-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { BAD_TOKEN_FEE_ERROR_MESSAGE } from './fee-validator';

export type GasEstimateDetails = {
  gasEstimate: BigNumber;
  gasPrice: BigNumber;
};

export type TransactionGasDetails = {
  gasLimit: BigNumber;
  gasPrice: BigNumber;
};

export const calculateGasLimit = (gasEstimate: BigNumber): BigNumber => {
  // Gas Limit: Add 20% to gas estimate.
  return gasEstimate.mul(12).div(10);
};

export const getEstimateGasDetails = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
): Promise<GasEstimateDetails> => {
  try {
    const provider = getProviderForNetwork(chainID);
    const [gasEstimate, gasPrice] = await Promise.all([
      provider.estimateGas(populatedTransaction).catch(throwErr),
      provider.getGasPrice().catch(throwErr),
    ]);
    return { gasEstimate, gasPrice };
  } catch (err) {
    if (err.message && err.message.includes('failed to meet quorum')) {
      throw new Error(BAD_TOKEN_FEE_ERROR_MESSAGE);
    }
    throw err;
  }
};

export const getMaximumGas = (
  gasEstimateDetails: GasEstimateDetails,
): BigNumber => {
  const gasLimit = calculateGasLimit(gasEstimateDetails.gasEstimate);
  return gasLimit.mul(gasEstimateDetails.gasPrice);
};

export const getMaximumGasFromTransactionGasDetails = ({
  gasLimit,
  gasPrice,
}: TransactionGasDetails) => {
  return gasLimit.mul(gasPrice);
};
