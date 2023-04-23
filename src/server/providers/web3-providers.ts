import { Eth } from 'web3-eth';
import { HttpProvider } from 'web3-core';
import configNetworks from '../config/config-networks';
import { RelayerChain } from '../../models/chain-models';

export const web3ProviderFromChainID = (chain: RelayerChain): HttpProvider => {
  const network = configNetworks[chain.type][chain.id];
  if (!network) {
    throw new Error(
      `No provider config available for ${chain.type}:${chain.id}.`,
    );
  }
  const { fallbackProviderConfig } = network;
  if (!fallbackProviderConfig?.providers.length) {
    throw new Error(
      `No remote provider config available for web3 provider: ${chain.type}:${chain.id}.`,
    );
  }

  const host = fallbackProviderConfig.providers[0].provider;

  const web3Provider = new Eth.providers.HttpProvider(host, {});
  return web3Provider;
};
