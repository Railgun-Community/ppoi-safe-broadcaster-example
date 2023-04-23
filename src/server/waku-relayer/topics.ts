import { RelayerChain } from '../../models/chain-models';

export const contentTopics = {
  default: () => '/railgun/v2/default/json',
  fees: (chain: RelayerChain) =>
    `/railgun/v2/${chain.type}/${chain.id}/fees/json`,
  transact: (chain: RelayerChain) =>
    `/railgun/v2/${chain.type}/${chain.id}/transact/json`,
  transactResponse: (chain: RelayerChain) =>
    `/railgun/v2/${chain.type}/${chain.id}/transact-response/json`,
  preAuthorize: (chain: RelayerChain) =>
    `/railgun/v2/${chain.type}/${chain.id}/pre-authorize/json`,
  preAuthorizeResponse: (chain: RelayerChain) =>
    `/railgun/v2/${chain.type}/${chain.id}/pre-authorize-response/json`,
};
