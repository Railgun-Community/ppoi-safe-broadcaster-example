import { BaseProvider, Network } from '@ethersproject/providers';
import { NetworkChainID } from '../config/config-chain-ids';
import configTokens from '../config/config-tokens';

export const mockTokenConfig = (
  chainID: NetworkChainID,
  tokenAddress: string,
) => {
  configTokens[chainID][tokenAddress] = {
    symbol: tokenAddress.toUpperCase(),
    decimals: 18,
  };
};

export const getMockProvider = (): BaseProvider => {
  return new BaseProvider({ name: 'Ethereum', chainId: 1 });
};
