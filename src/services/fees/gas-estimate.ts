import { BigNumber, PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import { getAnyWalletForNetwork } from '../wallets/active-wallets';

const calculateGasLimitHex = (gasEstimate: BigNumber): BigNumber => {
  // Gas Limit: Add 20% to gas estimate.
  return gasEstimate.mul(12).div(10);
};

export const estimateMaximumGas = async (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
): Promise<BigNumber> => {
  const wallet = getAnyWalletForNetwork(chainID);
  const [gasEstimate, gasPrice] = await Promise.all([
    wallet.estimateGas(populatedTransaction),
    wallet.getGasPrice(),
  ]);
  const gasLimit = calculateGasLimitHex(gasEstimate);
  return gasLimit.mul(gasPrice);
};
