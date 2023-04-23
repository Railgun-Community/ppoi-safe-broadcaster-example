import { Token } from '../../models/token-models';
import { logger } from '../../util/logger';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { RelayerChain } from '../../models/chain-models';
import { ABI_ERC20 } from '../abi/abi';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';

export const getERC20TokenBalance = async (
  chain: RelayerChain,
  walletAddress: string,
  token: Token,
): Promise<BigNumber> => {
  try {
    const provider = getProviderForNetwork(chain);
    const contract = new Contract(token.address, ABI_ERC20, provider);
    const balance: BigNumber = await contract.balanceOf(walletAddress);
    return balance;
  } catch (err) {
    logger.warn(`Could not get gas token balance: ${err.message}`);
    return BigNumber.from(0);
  }
};
