import { NetworkChainID } from '../../config/config-chain-ids';
import configTokens from '../../config/config-tokens';

export const allTokenAddressesForNetwork = (
  chainID: NetworkChainID,
): string[] => {
  return Object.keys(configTokens[chainID]);
};
