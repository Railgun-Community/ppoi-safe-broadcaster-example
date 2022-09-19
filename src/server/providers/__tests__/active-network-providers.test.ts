import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configNetworks from '../../config/config-networks';
import {
  getProviderForNetwork,
  initNetworkProviders,
} from '../active-network-providers';
import { getMockFallbackProviderConfig } from '../../../test/mocks.test';
import { testChainEthereum } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = testChainEthereum();

describe('active-network-providers', () => {
  before(() => {
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id].fallbackProviderConfig =
      getMockFallbackProviderConfig();
    initNetworkProviders();
  });

  it('Should init viable fallback providers', async () => {
    const provider = getProviderForNetwork(MOCK_CHAIN);
    const block = await provider.getBlockNumber();
    expect(block).to.be.greaterThan(14000000);
  }).timeout(20000);
}).timeout(20000);
