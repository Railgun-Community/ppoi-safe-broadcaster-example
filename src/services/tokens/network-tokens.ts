import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import configTokens from '../../config/config-tokens';
import { GasTokenConfig, Token } from '../../models/token-models';

export const allTokenAddressesForNetwork = (
  chainID: NetworkChainID,
): string[] => {
  return Object.keys(configTokens[chainID]);
};

const tokenForAddress = (chainID: NetworkChainID, address: string): Token => {
  const tokenConfig = configTokens[chainID][address];
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
  const gasToken = networkConfig.gasToken;
  if (!gasToken.wrappedAddress) {
    throw new Error(`No gas token address for network: ${chainID}`);
  }
  return {
    token,
    gasToken,
  };
};
