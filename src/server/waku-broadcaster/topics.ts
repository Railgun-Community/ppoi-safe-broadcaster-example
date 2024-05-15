import { BroadcasterChain } from '../../models/chain-models';

export const contentTopics = {
  default: () => '/railgun/v2/default/json',
  fees: (chain: BroadcasterChain) =>
    `/railgun/v2/${chain.type}/${chain.id}/fees/json`,
  transact: (chain: BroadcasterChain) =>
    `/railgun/v2/${chain.type}/${chain.id}/transact/json`,
  transactResponse: (chain: BroadcasterChain) =>
    `/railgun/v2/${chain.type}/${chain.id}/transact-response/json`,
};
