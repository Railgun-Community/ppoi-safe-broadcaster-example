import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';
import configTokens from '../config/config-tokens';
import { GasTokenConfig, Token } from '../../models/token-models';
import { AddressToTokenMap } from '../../models/config-models';

export const allTokenAddressesForNetwork = (
  chainID: NetworkChainID,
): string[] => {
  return Object.keys(configTokens[chainID]).map((tokenAddress) =>
    tokenAddress.toLowerCase(),
  );
};

const lowercaseTokenConfigMap = (
  chainID: NetworkChainID,
): AddressToTokenMap => {
  const lowercaseMap: AddressToTokenMap = {};
  const tokens = configTokens[chainID];
  const tokenAddresses = Object.keys(tokens);
  tokenAddresses.forEach((tokenAddress) => {
    lowercaseMap[tokenAddress.toLowerCase()] = tokens[tokenAddress];
  });
  return lowercaseMap;
};

export const tokenForAddress = (
  chainID: NetworkChainID,
  address: string,
): Token => {
  const tokenConfig = lowercaseTokenConfigMap(chainID)[address.toLowerCase()];
  if (!tokenConfig) {
    throw new Error(`Unsupported token for chain ${chainID}: ${address}`);
  }
  return {
    ...tokenConfig,
    address,
  };
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
