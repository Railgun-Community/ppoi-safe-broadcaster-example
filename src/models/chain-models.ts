import { ChainType } from '@railgun-community/shared-models';
import { NetworkChainID } from '../server/config/config-chains';

export type RelayerChain = {
  type: ChainType;
  id: NetworkChainID;
};
