import { BigNumber, PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';

export type EstimateGasDetails = {
  gasEstimate: BigNumber;
  gasPrice: BigNumber;
};

export const calculateGasLimit = (gasEstimate: BigNumber): BigNumber => {
  // Gas Limit: Add 20% to gas estimate.
  return gasEstimate.mul(12).div(10);
};

export const getGasDetails = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
): Promise<EstimateGasDetails> => {
  const provider = getProviderForNetwork(chainID);
  const [gasEstimate, gasPrice] = await Promise.all([
    provider.estimateGas(populatedTransaction),
    provider.getGasPrice(),
  ]);
  return { gasEstimate, gasPrice };
};

export const estimateMaximumGas = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
): Promise<BigNumber> => {
  const { gasEstimate, gasPrice } = await getGasDetails(
    chainID,
    populatedTransaction,
  );
  const gasLimit = calculateGasLimit(gasEstimate);
  return gasLimit.mul(gasPrice);
};
