import { ChainType } from '@railgun-community/engine';
import { NetworkChainID } from '../server/config/config-chains';
import { Network } from './network-models';
import { TokenConfig } from './token-models';

export type ChainTypeMap<T> = {
  [index in ChainType]: T;
};
export type ChainIDMap<T> = {
  [index in NetworkChainID]: T;
};

export type AddressToTokenMap = MapType<TokenConfig>;
export type NetworkTokensConfig = ChainTypeMap<ChainIDMap<AddressToTokenMap>>;
export type NetworksConfig = ChainTypeMap<ChainIDMap<Network>>;

export type Secrets = {
  dbEncryptionKey: string;
  mnemonic: string;
};
