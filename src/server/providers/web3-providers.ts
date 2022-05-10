import Web3 from 'web3-eth';
// eslint-disable-next-line import/no-extraneous-dependencies
import { HttpProvider } from 'web3-core';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';

// Hack to get the types to apply correctly.
const Web3Eth = Web3 as unknown as typeof Web3.Eth;

export const web3ProviderFromChainID = (
  chainID: NetworkChainID,
): HttpProvider => {
  const network = configNetworks[chainID];
  if (!network) {
    throw new Error(`No provider config available for ${chainID}.`);
  }
  const { fallbackProviderConfig } = network;
  if (!fallbackProviderConfig?.providers.length) {
    throw new Error(
      `No remote provider config available for web3 provider: ${chainID}.`,
    );
  }

  const host = fallbackProviderConfig.providers[0].provider;

  const web3Provider = new Web3Eth.providers.HttpProvider(host, {});
  return web3Provider;
};
