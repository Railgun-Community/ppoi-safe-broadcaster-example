import { Contract } from 'ethers';
import { Token } from '../../models/token-models';
import { logger } from '../../util/logger';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { RelayerChain } from '../../models/chain-models';
import { ABI_ERC20 } from '../abi/abi';
import { promiseTimeout, throwErr } from '../../util/promise-utils';

const BALANCE_TIMEOUT = 10 * 1000;

export const getERC20TokenBalance = async (
  chain: RelayerChain,
  walletAddress: string,
  token: Token,
): Promise<bigint> => {
  try {
    const provider = getProviderForNetwork(chain);
    const contract = new Contract(token.address, ABI_ERC20, provider);

    const balance = await promiseTimeout(
      contract.balanceOf(walletAddress),
      BALANCE_TIMEOUT,
    ).catch(throwErr);

    return balance;
  } catch (err) {
    logger.warn(`Could not get gas token balance: ${err.message}`);
    return 0n;
  }
};
