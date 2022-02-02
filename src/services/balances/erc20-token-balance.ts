import { BigNumber, Contract } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import { Token } from '../../models/token-models';
import { logger } from '../../util/logger';
import { abiForChainToken } from '../abi/abi';
import { getProviderForNetwork } from '../providers/active-network-providers';

export const getERC20TokenBalance = async (
  chainID: NetworkChainID,
  walletAddress: string,
  token: Token,
): Promise<BigNumber> => {
  try {
    const abi = abiForChainToken(chainID);
    const provider = getProviderForNetwork(chainID);
    const contract = new Contract(token.address, abi, provider);
    const balance: BigNumber = await contract.balanceOf(walletAddress);
    return balance;
  } catch (err: any) {
    logger.warn(`Could not get gas token balance: ${err.message}`);
    return BigNumber.from(0);
  }
};
