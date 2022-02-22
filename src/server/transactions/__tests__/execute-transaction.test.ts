/* globals describe, before, after, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Wallet as EthersWallet } from 'ethers';
import sinon from 'sinon';
import {
  createEthersWallet,
  getActiveWallets,
} from '../../wallets/active-wallets';
import {
  getCurrentNonce,
  LAST_NONCE_KEY,
  storeCurrentNonce,
} from '../execute-transaction';
import { getMockProvider } from '../../../test/mocks.test';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { initLepton } from '../../lepton/lepton-init';
import { getSettingsNumber, initSettingsDB } from '../../db/settings-db';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('execute-transaction', () => {
  before(async () => {
    initLepton();
    initSettingsDB();
    await setupSingleTestWallet();
  });

  it('Should get and store nonce values', async () => {
    const firstActiveWallet = getActiveWallets()[0];
    const ethersWallet = createEthersWallet(
      firstActiveWallet,
      getMockProvider(),
    );

    sinon.stub(EthersWallet.prototype, 'getTransactionCount').resolves(3);

    expect(await getSettingsNumber(LAST_NONCE_KEY)).to.be.undefined;

    let currentNonce: number;
    currentNonce = await getCurrentNonce(ethersWallet);
    expect(currentNonce).to.equal(3);

    await storeCurrentNonce(24);
    expect(await getSettingsNumber(LAST_NONCE_KEY)).to.equal(24);
    currentNonce = await getCurrentNonce(ethersWallet);
    expect(currentNonce).to.equal(25); // 24 + 1
  });
}).timeout(120000);
