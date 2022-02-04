import { Wallet as EthersWallet } from '@ethersproject/wallet';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { calculateGasLimit } from '../../server/fees/gas-estimate';
import { TransactionGasDetails } from '../../server/fees/calculate-transaction-gas';

export const gasEstimate = async (
  populatedTransaction: PopulatedTransaction,
  ethersWallet: EthersWallet,
): Promise<TransactionGasDetails> => {
  const [gasEstimate, gasPrice] = await Promise.all([
    ethersWallet.estimateGas(populatedTransaction),
    ethersWallet.getGasPrice(),
  ]);

  const gasLimit = calculateGasLimit(gasEstimate);
  return { gasLimit, gasPrice };
};
