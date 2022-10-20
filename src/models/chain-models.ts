import { ChainType } from '@railgun-community/engine';
import { NetworkChainID } from '../server/config/config-chains';

export type RelayerChain = {
  type: ChainType;
  id: NetworkChainID;
};
