import { NetworkChainID } from '../config/config-chain-ids';
import { removeNaNs } from '../../util/utils';
import configNetworks from '../config/config-networks';
import configDefaults from '../config/config-defaults';

export const configuredNetworkChainIDs = (): NetworkChainID[] => {
  const chainIDs: NetworkChainID[] = removeNaNs(
    Object.keys(NetworkChainID).map((chainID) => {
      return Number(chainID) as NetworkChainID;
    }),
  );
  return chainIDs
    .filter((chainID) => configDefaults.networks.active.includes(chainID))
    .filter((chainID) => configNetworks[chainID] != null);
};
