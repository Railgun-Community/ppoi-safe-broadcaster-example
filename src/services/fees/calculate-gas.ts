import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';

export interface TransactionGasDetails {
  gasEstimate: BigNumber;
  gasPrice: BigNumber;
}

export const createGasDetails = async (
  chainID: NetworkChainID,
  tokenFee: BigNumber,
  tokenAddress: string,
): Promise<TransactionGasDetails> => {
  // TODO: Create actual gas details from token fee.

  return {
    gasEstimate: BigNumber.from(0),
    gasPrice: BigNumber.from(0),
  };
};
