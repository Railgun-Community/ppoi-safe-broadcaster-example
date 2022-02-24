import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import axios from 'axios';
import { quickSync } from '../quick-sync';
import { NetworkChainID } from '../../../config/config-chain-ids';
import configNetworks from '../../../config/config-networks';
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
    expect(eventLog.commitmentEvents).to.be.an('array');
    expect(eventLog.nullifierEvents).to.be.an('array');
    expect(eventLog.commitmentEvents.length).to.be.at.least(10);
    expect(eventLog.nullifierEvents.length).to.be.at.least(2);
  }).timeout(10000);

  it('Should retry Railgun Event Log API fetch on error', () => {
    const stubAxiosGet = sinon.stub(axios, 'get').throws();
    expect(quickSync(NetworkChainID.Ropsten, 0)).to.be.rejected;
    expect(stubAxiosGet.callCount).to.equal(3);
    stubAxiosGet.restore();
  });

  it('Should error if invalid type', () => {
    let stubAxiosGet: SinonStub;
    stubAxiosGet = sinon.stub(axios, 'get').resolves({ data: null });
    expect(quickSync(NetworkChainID.Ropsten, 0)).to.be.rejectedWith(
      'Expected object `eventLog` response.',
    );
    stubAxiosGet.restore();

    stubAxiosGet = sinon
      .stub(axios, 'get')
      .resolves({ data: { nullifierEvents: [] } });
    expect(quickSync(NetworkChainID.Ropsten, 0)).to.be.rejectedWith(
      'Expected object `commitmentEvents` response.',
    );
    stubAxiosGet.restore();

    stubAxiosGet = sinon
      .stub(axios, 'get')
      .resolves({ data: { commitmentEvents: [] } });
    expect(quickSync(NetworkChainID.Ropsten, 0)).to.be.rejectedWith(
      'Expected object `nullifierEvents` response.',
    );
    stubAxiosGet.restore();
  });
}).timeout(30000);
