/* globals describe, before, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import {
  getProviderForNetwork,
  initNetworkProviders,
} from '../active-network-providers';
import { getMockFallbackProviderConfig } from '../../../test/mocks.test';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('active-network-providers', () => {
  before(() => {
    configNetworks[NetworkChainID.Ethereum].fallbackProviderConfig =
      getMockFallbackProviderConfig();
    initNetworkProviders();
  });

  it('Should init viable fallback providers', async () => {
    const provider = getProviderForNetwork(NetworkChainID.Ethereum);
    const block = await provider.getBlockNumber();
    expect(block).to.be.greaterThan(14000000);
  });
}).timeout(10000);
