import { Contract } from 'ethers';
import { Token } from '../../models/token-models';
import { logger } from '../../util/logger';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { RelayerChain } from '../../models/chain-models';
import { ABI_ERC20 } from '../abi/abi';

export const getERC20TokenBalance = async (
  chain: RelayerChain,
  walletAddress: string,
  token: Token,
): Promise<bigint> => {
  try {
    const provider = getProviderForNetwork(chain);
    const contract = new Contract(token.address, ABI_ERC20, provider);
    return await contract.balanceOf(walletAddress);
  } catch (err) {
    logger.warn(`Could not get gas token balance: ${err.message}`);
    return 0n;
  }
};
