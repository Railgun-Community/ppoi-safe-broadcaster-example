import { BigNumber, Contract, Wallet as EthersWallet } from 'ethers';
import { abiForChainToken } from '../../server/abi/abi';
import { NetworkChainID } from '../../server/config/config-chain-ids';
import { getProviderForNetwork } from '../../server/providers/active-network-providers';
import { logger } from '../../util/logger';

export const getWalletGasTokenBalance = async (
  wallet: EthersWallet,
  address: string,
): Promise<BigNumber> => {
  try {
    const balance = await wallet.getBalance(address);
    return balance;
  } catch (error: any) {
    logger.error(error);
    throw new Error(error.message);
  }
};

export const getWalletERC20TokenBalance = async (
  chainID: NetworkChainID,
  walletAddress: string,
  tokenAddress: string,
): Promise<Optional<BigNumber>> => {
  try {
    const abi = abiForChainToken(chainID);
    const contract = new Contract(
      tokenAddress,
      abi,
      getProviderForNetwork(chainID),
    );
    const balance: BigNumber = await contract.balanceOf(walletAddress);
    return balance;
  } catch (error: any) {
    logger.error(error);
    throw new Error(error.message);
  }
};
