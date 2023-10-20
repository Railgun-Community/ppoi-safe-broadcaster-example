import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { initRelayerModules } from '../relayer-init';
import * as engineInitModule from '../../engine/engine-init';
import * as activeWalletsModule from '../../wallets/active-wallets';
import * as activeProvidersModule from '../../providers/active-network-providers';
import * as activeTokenPricePollerModule from '../../tokens/token-price-poller';
import { closeSettingsDB } from '../../db/settings-db';
import { resetConfigDefaults } from '../../../test/setup.test';
import { myConfigOverrides } from '../../../MY-CONFIG';
import { POIAssurance } from '../../transactions/poi-assurance';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('relayer-init', () => {
  after(async () => {
    await closeSettingsDB();
    await POIAssurance.deinit();
  });

  it('Should run init scripts', async () => {
    const stubInitEngine = sinon
      .stub(engineInitModule, 'startEngine')
      .returns();
    const stubInitWallets = sinon
      .stub(activeWalletsModule, 'initWallets')
      .resolves();
    const stubInitNetworkProviders = sinon
      .stub(activeProvidersModule, 'initNetworkProviders')
      .resolves();
    const stubInitPricePoller = sinon
      .stub(activeTokenPricePollerModule, 'initPricePoller')
      .resolves();

    const forTest = true;
    await initRelayerModules(forTest);

    expect(stubInitEngine.calledOnce).to.be.true;
    expect(stubInitWallets.calledOnce).to.be.true;
    expect(stubInitNetworkProviders.calledOnce).to.be.true;
    expect(stubInitPricePoller.calledOnce).to.be.true;

    stubInitEngine.restore();
    stubInitWallets.restore();
    stubInitNetworkProviders.restore();
    stubInitPricePoller.restore();
  });

  it('Should test MY-CONFIG loads correctly', () => {
    myConfigOverrides();
    resetConfigDefaults();
  });
}).timeout(31000);
