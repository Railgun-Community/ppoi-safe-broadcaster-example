import { NetworkChainID } from '../config/config-chain-ids';
import { removeNaNs } from '../../util/utils';

export const allNetworkChainIDs = (): NetworkChainID[] => {
  return removeNaNs(
    Object.keys(NetworkChainID).map((item) => {
      return Number(item) as NetworkChainID;
    }),
  );
};
