import { ChainType } from '@railgun-community/shared-models';
import { NetworkChainID } from '../server/config/config-chains';

export type BroadcasterChain = {
  type: ChainType;
  id: NetworkChainID;
};
