import { NetworkChainID } from '../config/config-chain-ids';
import { removeNaNs } from '../../util/utils';
import configNetworks from '../config/config-networks';

export const allNetworkChainIDs = (): NetworkChainID[] => {
  const chainIDs = removeNaNs(
    Object.keys(NetworkChainID).map((chainID) => {
      return Number(chainID) as NetworkChainID;
    }),
  );
  return chainIDs.filter((chainID: NetworkChainID) => configNetworks[chainID]);
};
