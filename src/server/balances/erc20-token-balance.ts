import { BigNumber, Contract } from 'ethers';
import { Token } from '../../models/token-models';
import { logger } from '../../util/logger';
import { abiForChainToken } from '../abi/abi';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { RelayerChain } from '../../models/chain-models';

export const getERC20TokenBalance = async (
  chain: RelayerChain,
  walletAddress: string,
  token: Token,
): Promise<BigNumber> => {
  try {
    const abi = abiForChainToken(chain);
    const provider = getProviderForNetwork(chain);
    const contract = new Contract(token.address, abi, provider);
    const balance: BigNumber = await contract.balanceOf(walletAddress);
    return balance;
  } catch (err: any) {
    logger.warn(`Could not get gas token balance: ${err.message}`);
    return BigNumber.from(0);
  }
};
