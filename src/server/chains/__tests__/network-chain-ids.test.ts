import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { setupTestNetwork } from '../../../test/setup.test';
import { configuredNetworkChainIDs } from '../network-chain-ids';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('network-chain-ids', () => {
  before(() => {
    setupTestNetwork();
  });

  it('Should pull correct chain IDs', () => {
    const chainIDs = configuredNetworkChainIDs();
    expect(chainIDs).to.contain(1);
    expect(chainIDs).not.to.contain(null);
  });
}).timeout(10000);
