import { ChainType } from '@railgun-community/engine/dist/models/engine-types';
import { NetworkChainID } from '../server/config/config-chains';

export type RelayerChain = {
  type: ChainType;
  id: NetworkChainID;
};
