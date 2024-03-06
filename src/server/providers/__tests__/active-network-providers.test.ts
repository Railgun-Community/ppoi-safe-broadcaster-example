import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  getProviderForNetwork,
  initNetworkProviders,
} from '../active-network-providers';
import { testChainEthereum } from '../../../test/setup.test';
import { startEngine } from '../../engine/engine-init';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = testChainEthereum();

describe('active-network-providers', () => {
  before(async () => {
    await startEngine();
    await initNetworkProviders();
  });

  it('Should init viable fallback providers', async () => {
    const provider = getProviderForNetwork(MOCK_CHAIN);
    const block = await provider.getBlockNumber();
    expect(block).to.be.greaterThan(14000000);
  }).timeout(20000);
}).timeout(20000);
