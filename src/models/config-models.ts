import { Network } from './network-models';

export type DefaultsConfig = {};

export type WalletsConfig = {
  wallets: {
    mnemonic: string;
  }[];
};

export type NetworksConfig = NumMapType<Network>;
