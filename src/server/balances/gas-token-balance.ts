import { logger } from '../../util/logger';
import {
  // getProviderForNetwork,
  getFirstJsonRpcProviderForNetwork,
} from '../providers/active-network-providers';
import { promiseTimeout, throwErr } from '../../util/promise-utils';
import { BroadcasterChain } from '../../models/chain-models';

export const getGasTokenBalance = async (
  chain: BroadcasterChain,
  walletAddress: string,
): Promise<Optional<bigint>> => {
  try {
    const provider = getFirstJsonRpcProviderForNetwork(chain);
    const balance = await promiseTimeout(
      provider.getBalance(walletAddress),
      3 * 1000,
    ).catch(throwErr);
    return balance;
  } catch (err) {
    logger.error(
      new Error(
        `Could not get GAS token balance: ${err.message} on chain ${chain.type}:${chain.id} for ${walletAddress}`,
      ),
    );
    return undefined;
  }
};
