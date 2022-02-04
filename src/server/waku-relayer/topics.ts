import { NetworkChainID } from '../config/config-chain-ids';

export const contentTopics = {
  default: () => '/railgun/1/default/json',
  greet: () => '/railgun/1/greet/json',
  fees: (chainID: NetworkChainID) => `/railgun/1/${chainID}/fees/json`,
  transact: () => '/railgun/1/transact/json',
};
