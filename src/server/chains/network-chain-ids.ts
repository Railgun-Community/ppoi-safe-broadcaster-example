import { NetworkChainID } from '../config/config-chains';
import configNetworks from '../config/config-networks';
import configDefaults from '../config/config-defaults';
import { BroadcasterChain } from '../../models/chain-models';
import { removeUndefineds } from '../../util/utils';
import { ChainType } from '@railgun-community/shared-models';

export const configuredNetworkChains = (): BroadcasterChain[] => {
  const chainTypes: ChainType[] = removeUndefineds(
    Object.keys(configNetworks),
  ).map((chainType) => Number(chainType));
  const chains: BroadcasterChain[] = [];

  chainTypes.forEach((chainType) => {
    const chainIDs: NetworkChainID[] = removeUndefineds(
      Object.keys(configNetworks[chainType]),
    ).map((chainID) => Number(chainID));
    chains.push(
      ...chainIDs.map((chainID) => {
        return {
          type: chainType,
          id: chainID,
        };
      }),
    );
  });

  return chains.filter(
    (chain) =>
      chain.type !== ChainType.EVM ||
      configDefaults.networks.EVM.includes(chain.id),
  );
};
