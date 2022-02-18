import { NetworkChainID } from '../server/config/config-chain-ids';
import { Network } from './network-models';
import { TokenConfig } from './token-models';
import { WalletConfig } from './wallet-models';

type ChainIDMapType<T> = {
  [index in NetworkChainID]: T;
};

export type AddressToTokenMap = MapType<TokenConfig>;
export type NetworkTokensConfig = ChainIDMapType<AddressToTokenMap>;

export type NetworksConfig = ChainIDMapType<Network>;

export type Secrets = {
  dbEncryptionKey: string;
  mnemonic: string;
};
