import { NetworkChainID } from '../config/config-chain-ids';

export const contentTopics = {
  default: () => '/railgun/v1/default/json',
  greet: () => '/railgun/v1/greet/json',
  fees: (chainID: NetworkChainID) => `/railgun/v1/${chainID}/fees/json`,
  transact: () => '/railgun/v1/transact/json',
};
