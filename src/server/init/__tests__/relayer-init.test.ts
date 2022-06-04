import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { initRelayerModules } from '../relayer-init';
import * as leptonInitModule from '../../lepton/lepton-init';
import * as activeWalletsModule from '../../wallets/active-wallets';
import * as activeProvidersModule from '../../providers/active-network-providers';
import * as activeTokenPricePollerModule from '../../tokens/token-price-poller';
import { closeSettingsDB } from '../../db/settings-db';
import { resetConfigDefaults } from '../../../test/setup.test';
// @ts-ignore
import { myConfigOverrides } from '../../../MY-CONFIG';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('relayer-init', () => {
  after(() => {
    closeSettingsDB();
  });

  it('Should run init scripts', async () => {
    const stubInitLepton = sinon.stub(leptonInitModule, 'initLepton').returns();
    const stubInitWallets = sinon
      .stub(activeWalletsModule, 'initWallets')
      .resolves();
    const stubInitNetworkProviders = sinon
      .stub(activeProvidersModule, 'initNetworkProviders')
      .resolves();
    const stubInitPricePoller = sinon
      .stub(activeTokenPricePollerModule, 'initPricePoller')
      .returns();

    const forTest = true;
    await initRelayerModules(forTest);

    expect(stubInitLepton.calledOnce).to.be.true;
    expect(stubInitWallets.calledOnce).to.be.true;
    expect(stubInitNetworkProviders.calledOnce).to.be.true;
    expect(stubInitPricePoller.calledOnce).to.be.true;

    stubInitLepton.restore();
    stubInitWallets.restore();
    stubInitNetworkProviders.restore();
    stubInitPricePoller.restore();
  });

  it('Should test MY-CONFIG loads correctly', () => {
    myConfigOverrides();
    resetConfigDefaults();
  });
}).timeout(10000);
