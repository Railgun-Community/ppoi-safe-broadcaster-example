import { Network } from './network-models';
import { WalletConfig } from './wallet-models';

export type DefaultsConfig = {};

export type WalletsConfig = {
  wallets: WalletConfig[];
};

export type NetworksConfig = NumMapType<Network>;
