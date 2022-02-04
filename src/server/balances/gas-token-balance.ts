import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { logger } from '../../util/logger';
import { getProviderForNetwork } from '../providers/active-network-providers';

export const getGasTokenBalance = async (
  chainID: NetworkChainID,
  walletAddress: string,
): Promise<BigNumber> => {
  try {
    const provider = getProviderForNetwork(chainID);
    const balance = await provider.getBalance(walletAddress);
    return balance;
  } catch (err: any) {
    logger.warn(`Could not get gas token balance: ${err.message}`);
    return BigNumber.from(0);
  }
};
