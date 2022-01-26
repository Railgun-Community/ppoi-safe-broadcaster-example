import { NetworkChainID } from '../config/config-chain-ids';
import configTokens from '../config/config-tokens';

export const mockTokenDetails = (
  chainID: NetworkChainID,
  tokenAddress: string,
) => {
  configTokens[chainID][tokenAddress] = {
    symbol: tokenAddress.toUpperCase(),
    decimals: 18,
  };
};
