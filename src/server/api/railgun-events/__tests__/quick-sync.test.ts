import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import axios from 'axios';
import { quickSyncLegacy } from '../quick-sync-legacy';
import configNetworks from '../../../config/config-networks';
import { getMockNetwork } from '../../../../test/mocks.test';
import { testChainPolygon } from '../../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN_POLYGON = testChainPolygon();

describe('quick-sync', () => {
  before(() => {
    configNetworks[MOCK_CHAIN_POLYGON.type][MOCK_CHAIN_POLYGON.id] =
      getMockNetwork();
  });

  it.skip('Should run live Railgun Event Log fetch for Ethereum', async () => {
    const eventLog = await quickSyncLegacy(MOCK_CHAIN_POLYGON, 0);
    expect(eventLog).to.be.an('object');
    expect(eventLog.commitmentEvents).to.be.an('array');
    expect(eventLog.nullifierEvents).to.be.an('array');
    expect(eventLog.commitmentEvents.length).to.be.at.least(800);
    expect(eventLog.nullifierEvents.length).to.be.at.least(800);
  }).timeout(20000);

  it('Should retry Railgun Event Log API fetch on error', async () => {
    const stubAxiosGet = sinon.stub(axios, 'get').throws();
    await expect(quickSyncLegacy(MOCK_CHAIN_POLYGON, 0)).to.be.rejected;
    expect(stubAxiosGet.callCount).to.equal(3);
    stubAxiosGet.restore();
  });

  it('[legacy] Should error if invalid type', async () => {
    let stubAxiosGet: SinonStub;
    stubAxiosGet = sinon.stub(axios, 'get').resolves({ data: null });
    await expect(quickSyncLegacy(MOCK_CHAIN_POLYGON, 0)).to.be.rejectedWith(
      'Expected object `eventLog` response.',
    );
    stubAxiosGet.restore();

    stubAxiosGet = sinon
      .stub(axios, 'get')
      .resolves({ data: { unshieldEvents: [], nullifierEvents: [] } });
    await expect(quickSyncLegacy(MOCK_CHAIN_POLYGON, 0)).to.be.rejectedWith(
      'Expected object `commitmentEvents` response.',
    );
    stubAxiosGet.restore();

    // stubAxiosGet = sinon
    //   .stub(axios, 'get')
    //   .resolves({ data: { commitmentEvents: [], nullifierEvents: [] } });
    // await expect(quickSyncLegacy(MOCK_CHAIN_POLYGON, 0)).to.be.rejectedWith(
    //   'Expected object `unshieldEvents` response.',
    // );
    // stubAxiosGet.restore();

    stubAxiosGet = sinon
      .stub(axios, 'get')
      .resolves({ data: { commitmentEvents: [], unshieldEvents: [] } });
    await expect(quickSyncLegacy(MOCK_CHAIN_POLYGON, 0)).to.be.rejectedWith(
      'Expected object `nullifierEvents` response.',
    );
    stubAxiosGet.restore();
  });
}).timeout(30000);
