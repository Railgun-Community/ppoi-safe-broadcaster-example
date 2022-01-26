/* globals describe, before, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../../config/config-chain-ids';
import configNetworks from '../../../config/config-networks';
import { FallbackProviderJsonConfig } from '../../../models/provider-models';
import {
  getProviderForNetwork,
  initNetworkProviders,
} from '../active-network-providers';

chai.use(chaiAsPromised);
const { expect } = chai;

const mockConfig: FallbackProviderJsonConfig = {
  chainId: 1,
  providers: [
    {
      provider: 'https://eth.railgun.ch',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://cloudflare-eth.com',
      priority: 2,
      weight: 1,
    },
  ],
};

describe('active-network-providers', () => {
  before(() => {
    configNetworks[NetworkChainID.Ethereum].fallbackProviderConfig = mockConfig;
    initNetworkProviders();
  });

  it('Should init viable fallback providers', async () => {
    const provider = getProviderForNetwork(NetworkChainID.Ethereum);
    const block = await provider.getBlockNumber();
    expect(block).to.be.greaterThan(14000000);
  });
}).timeout(10000);
