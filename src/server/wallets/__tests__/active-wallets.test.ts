/* globals describe, before, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getMockProvider } from '../../../test/mocks.test';
import {
  createEthersWallet,
  getActiveWallets,
  getRailgunAddress,
} from '../active-wallets';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { initLepton } from '../../lepton/lepton-init';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('active-wallets', () => {
  before(async () => {
    initLepton('test.db');
    await setupSingleTestWallet();
  });

  it('Should have correct wallet address and keys', () => {
    const activeWallet = getActiveWallets()[0];
    const provider = getMockProvider();
    const ethersWallet = createEthersWallet(activeWallet, provider);
    expect(ethersWallet.address).to.equal(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    );
    expect(ethersWallet.publicKey).to.equal(
      '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    );
    expect(ethersWallet.privateKey).to.equal(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    );
  });

  it('Should have Railgun wallet with valid address', () => {
    const railgunAddress = getRailgunAddress();
    expect(railgunAddress).to.equal(
      'rgany1q8y4j4ssfa53xxcuy6wrq6yd8tld6rp6z4wjwr5x96jvr7y6vqapkz2ffkk',
    );
  });
}).timeout(10000);
