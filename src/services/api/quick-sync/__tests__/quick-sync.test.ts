/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { quickSync } from '../quick-sync';
import axios from 'axios';
import { NetworkChainID } from '../../../../config/config-chain-ids';
import configNetworks from '../../../../config/config-networks';
import { getMockRopstenNetwork } from '../../../../test/mocks.test';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('quick-sync', () => {
  before(() => {
    configNetworks[NetworkChainID.Ropsten] = getMockRopstenNetwork();
  });

  it('Should run live Railgun Event Log fetch for Ropsten', async () => {
    const eventLog = await quickSync(NetworkChainID.Ropsten, 0);
    expect(eventLog).to.be.an('object');
    expect(eventLog.commitments.length).to.be.at.least(40);
    expect(eventLog.nullifiers.length).to.be.at.least(10);
  }).timeout(10000);

  it('Should retry Railgun Event Log API fetch on error', async () => {
    const stubAxiosGet = sinon.stub(axios, 'get').throws();
    expect(quickSync(NetworkChainID.Ropsten, 0)).to.be.rejected;
    expect(stubAxiosGet.callCount).to.equal(3);
    stubAxiosGet.restore();
  });
}).timeout(30000);
