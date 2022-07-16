import { FallbackProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';
import configTokens from '../config/config-tokens';
import { GasTokenConfig, Token } from '../../models/token-models';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { removeUndefineds } from '../../util/utils';
import { logger } from '../../util/logger';
import { abiForChainToken } from '../abi/abi';

export const networkTokens: NumMapType<Token[]> = {};

export const initTokens = async () => {
  for (const chainID of configuredNetworkChainIDs()) {
    const tokensForChain = configTokens[chainID];
    if (!tokensForChain) {
      networkTokens[chainID] = [];
      continue;
    }
    const tokenAddresses = Object.keys(tokensForChain);
    const provider = getProviderForNetwork(chainID);
    const abi = abiForChainToken(chainID);
    const tokenPromises = tokenAddresses.map((tokenAddress) =>
      erc20TokenDetailsForAddress(tokenAddress, provider, abi, chainID),
    );
    // eslint-disable-next-line no-await-in-loop
    const tokens = await Promise.all(tokenPromises);
    networkTokens[chainID] = removeUndefineds(tokens);
  }
};

export const getERC20Decimals = (
  tokenAddress: string,
  provider: FallbackProvider,
  abi: Array<any>,
): Promise<number> => {
  const contract = new Contract(tokenAddress, abi, provider);
  return contract.decimals();
};

const erc20TokenDetailsForAddress = async (
  tokenAddress: string,
  provider: FallbackProvider,
  abi: Array<any>,
  chainID: NetworkChainID,
): Promise<Optional<Token>> => {
  const { symbol } = configTokens[chainID][tokenAddress];
  try {
    const decimals = await getERC20Decimals(tokenAddress, provider, abi);
    return {
      symbol,
      address: tokenAddress,
      decimals,
    };
  } catch (err: any) {
    logger.warn(
      `Could not load token ${tokenAddress} (${symbol}) for chain ${chainID}: ${err.message}`,
    );
    return undefined;
  }
};

export const allTokenAddressesForNetwork = (
  chainID: NetworkChainID,
): string[] => {
  return networkTokens[chainID].map((token) => token.address.toLowerCase());
};

export const tokenForAddress = (
  chainID: NetworkChainID,
  address: string,
): Token => {
  const lowercaseAddress = address.toLowerCase();
  const tokens = networkTokens[chainID];
  for (const token of tokens) {
    if (token.address.toLowerCase() === lowercaseAddress) {
      return token;
    }
  }
  throw new Error(`Unsupported token for chain ${chainID}: ${address}`);
};

export const getTransactionTokens = (
  chainID: NetworkChainID,
  tokenAddress: string,
): { token: Token; gasToken: GasTokenConfig } => {
  const token = tokenForAddress(chainID, tokenAddress);
  const networkConfig = configNetworks[chainID];
  const { gasToken } = networkConfig;
  return {
    token,
    gasToken,
  };
};
