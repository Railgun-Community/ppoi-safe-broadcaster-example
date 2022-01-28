import { BigNumber, PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';

const calculateGasLimitHex = (gasEstimate: BigNumber): BigNumber => {
  // Gas Limit: Add 20% to gas estimate.
  return gasEstimate.mul(12).div(10);
};

export const estimateMaximumGas = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
): Promise<BigNumber> => {
  const provider = getProviderForNetwork(chainID);
  const [gasEstimate, gasPrice] = await Promise.all([
    provider.estimateGas(populatedTransaction),
    provider.getGasPrice(),
  ]);
  const gasLimit = calculateGasLimitHex(gasEstimate);
  return gasLimit.mul(gasPrice);
};
