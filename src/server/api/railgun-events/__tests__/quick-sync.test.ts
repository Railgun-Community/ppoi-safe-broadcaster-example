import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import axios from 'axios';
import { quickSync } from '../quick-sync';
import configNetworks from '../../../config/config-networks';
import { getMockRopstenNetwork } from '../../../../test/mocks.test';
import { testChainEthereum } from '../../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN_ETHEREUM = testChainEthereum();

describe('quick-sync', () => {
  before(() => {
    configNetworks[MOCK_CHAIN_ETHEREUM.type][MOCK_CHAIN_ETHEREUM.id] =
      getMockRopstenNetwork();
  });

  it('Should run live Railgun Event Log fetch for Ropsten', async () => {
    const eventLog = await quickSync(MOCK_CHAIN_ETHEREUM, 0);
    expect(eventLog).to.be.an('object');
    expect(eventLog.commitmentEvents).to.be.an('array');
    expect(eventLog.nullifierEvents).to.be.an('array');
    expect(eventLog.commitmentEvents.length).to.be.at.least(800);
    expect(eventLog.nullifierEvents.length).to.be.at.least(800);
  }).timeout(20000);

  it('Should retry Railgun Event Log API fetch on error', async () => {
    const stubAxiosGet = sinon.stub(axios, 'get').throws();
    await expect(quickSync(MOCK_CHAIN_ETHEREUM, 0)).to.be.rejected;
    expect(stubAxiosGet.callCount).to.equal(3);
    stubAxiosGet.restore();
  });

  it('Should error if invalid type', async () => {
    let stubAxiosGet: SinonStub;
    stubAxiosGet = sinon.stub(axios, 'get').resolves({ data: null });
    await expect(quickSync(MOCK_CHAIN_ETHEREUM, 0)).to.be.rejectedWith(
      'Expected object `eventLog` response.',
    );
    stubAxiosGet.restore();

    stubAxiosGet = sinon
      .stub(axios, 'get')
      .resolves({ data: { nullifierEvents: [] } });
    await expect(quickSync(MOCK_CHAIN_ETHEREUM, 0)).to.be.rejectedWith(
      'Expected object `commitmentEvents` response.',
    );
    stubAxiosGet.restore();

    stubAxiosGet = sinon
      .stub(axios, 'get')
      .resolves({ data: { commitmentEvents: [] } });
    await expect(quickSync(MOCK_CHAIN_ETHEREUM, 0)).to.be.rejectedWith(
      'Expected object `nullifierEvents` response.',
    );
    stubAxiosGet.restore();
  });
}).timeout(30000);
