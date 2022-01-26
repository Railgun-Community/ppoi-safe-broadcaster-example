import { BigNumber, PopulatedTransaction } from 'ethers';
import { hexlify } from 'ethers/lib/utils';
import { NetworkChainID } from '../../config/config-chain-ids';
import { getAnyWalletForNetwork } from '../wallets/active-wallets';

const calculateGasLimitHex = (gasEstimate: BigNumber): BigNumber => {
  // TODO: Do we need a better way to calculate gas limit, than just adding 20%?
  // TODO: Remove decimal numbers: only BigNumber.
  const gasLimitDecimal = Math.round(Number(gasEstimate) * 1.2);
  return BigNumber.from(hexlify(gasLimitDecimal));
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
