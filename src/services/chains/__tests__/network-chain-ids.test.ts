/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { setupTestNetwork } from '../../../test/setup.test';
import { allNetworkChainIDs } from '../network-chain-ids';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('network-chain-ids', () => {
  before(() => {
    setupTestNetwork();
  });

  it('Should pull correct chain IDs', () => {
    const chainIDs = allNetworkChainIDs();
    expect(chainIDs).to.contain(1);
    expect(chainIDs).not.to.contain(null);
  });
}).timeout(10000);
