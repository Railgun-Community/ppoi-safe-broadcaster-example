import { BigNumber, PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';

export type GasEstimateDetails = {
  gasEstimate: BigNumber;
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
  const provider = getProviderForNetwork(chainID);
  const [gasEstimate, gasPrice] = await Promise.all([
    provider.estimateGas(populatedTransaction),
    provider.getGasPrice(),
  ]);
  return { gasEstimate, gasPrice };
};

export const getMaximumGas = (
  gasEstimateDetails: GasEstimateDetails,
): BigNumber => {
  const gasLimit = calculateGasLimit(gasEstimateDetails.gasEstimate);
  return gasLimit.mul(gasEstimateDetails.gasPrice);
};
