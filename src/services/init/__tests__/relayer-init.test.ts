/* globals describe, before, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { initRelayer } from '../relayer-init';
import * as leptonInitModule from '../../lepton/lepton-init';
import * as activeWalletsModule from '../../wallets/active-wallets';
import * as activeProvidersModule from '../../providers/active-network-providers';
import * as activeTokenPricePollerModule from '../../tokens/token-price-poller';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('relayer-init', () => {
  it('Should run init scripts', async () => {
    const stubInitLepton = sinon.stub(leptonInitModule, 'initLepton').returns();
    const stubInitWallets = sinon
      .stub(activeWalletsModule, 'initWallets')
      .resolves();
    const stubInitNetworkProviders = sinon
      .stub(activeProvidersModule, 'initNetworkProviders')
      .returns();
    const stubInitPricePoller = sinon
      .stub(activeTokenPricePollerModule, 'initPricePoller')
      .returns();

    await initRelayer();

    expect(stubInitLepton.calledOnce).to.be.true;
    expect(stubInitWallets.calledOnce).to.be.true;
    expect(stubInitNetworkProviders.calledOnce).to.be.true;
    expect(stubInitPricePoller.calledOnce).to.be.true;

    stubInitLepton.restore();
    stubInitWallets.restore();
    stubInitNetworkProviders.restore();
    stubInitPricePoller.restore();
  });
}).timeout(10000);
