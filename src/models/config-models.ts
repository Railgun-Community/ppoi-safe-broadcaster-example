import { NetworkChainID } from '../config/config-chain-ids';
import { Network } from './network-models';
import { TokenConfig } from './token-models';
import { WalletConfig } from './wallet-models';

type ChainIDMapType<T> = {
  [index in NetworkChainID]: T;
};

type AddressToTokenMap = MapType<TokenConfig>;
export type NetworkTokensConfig = ChainIDMapType<AddressToTokenMap>;

export type WalletsConfig = {
  wallets: WalletConfig[];
};

export type NetworksConfig = ChainIDMapType<Network>;
