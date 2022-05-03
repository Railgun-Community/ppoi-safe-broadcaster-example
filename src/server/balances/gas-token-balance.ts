import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { logger } from '../../util/logger';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { throwErr } from '../../util/promise-utils';

export const getGasTokenBalance = async (
  chainID: NetworkChainID,
  walletAddress: string,
): Promise<Optional<BigNumber>> => {
  try {
    const provider = getProviderForNetwork(chainID);
    const balance = await provider.getBalance(walletAddress).catch(throwErr);
    return balance;
  } catch (err: any) {
    logger.error(new Error(`Could not get gas token balance: ${err.message}`));
    return undefined;
  }
};
