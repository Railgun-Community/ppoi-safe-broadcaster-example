/* globals describe, before, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getMockProvider } from '../../../test/mocks.test';
import { walletForIndex } from '../active-wallets';
import { setupSingleTestWallet } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('active-wallets', () => {
  before(() => {
    setupSingleTestWallet();
  });

  it('Should have correct wallet address and keys', () => {
    const provider = getMockProvider();
    const wallet = walletForIndex(0, provider);
    expect(wallet.address).to.equal(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    );
    expect(wallet.publicKey).to.equal(
      '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    );
    expect(wallet.privateKey).to.equal(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    );
  });
}).timeout(10000);
