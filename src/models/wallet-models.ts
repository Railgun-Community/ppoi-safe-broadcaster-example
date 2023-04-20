import { NetworkChainID } from '../server/config/config-chains';

export type ActiveWallet = {
  address: string;
  pkey: string;
  index: number;
  priority: number;
  chains: NetworkChainID[];
};
