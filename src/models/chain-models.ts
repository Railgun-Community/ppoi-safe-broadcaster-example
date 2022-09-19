import { ChainType } from '@railgun-community/lepton/dist/models/lepton-types';
import { NetworkChainID } from '../server/config/config-chains';

export type RelayerChain = {
  type: ChainType;
  id: NetworkChainID;
};
