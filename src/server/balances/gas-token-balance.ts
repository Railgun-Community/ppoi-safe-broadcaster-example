import { BigNumber } from 'ethers';
import { logger } from '../../util/logger';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { throwErr } from '../../util/promise-utils';
import { RelayerChain } from '../../models/chain-models';

export const getGasTokenBalance = async (
  chain: RelayerChain,
  walletAddress: string,
): Promise<Optional<BigNumber>> => {
  try {
    const provider = getProviderForNetwork(chain);
    const balance = await provider.getBalance(walletAddress).catch(throwErr);
    return balance;
  } catch (err) {
    logger.error(new Error(`Could not get gas token balance: ${err.message}`));
    return undefined;
  }
};
