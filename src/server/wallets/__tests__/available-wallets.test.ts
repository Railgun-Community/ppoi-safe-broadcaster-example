import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { initLepton } from '../../lepton/lepton-init';
import { isWalletAvailable, setWalletAvailable } from '../available-wallets';
import { getActiveWallets } from '../active-wallets';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('available-wallets', () => {
  before(async () => {
    initLepton();
    await setupSingleTestWallet();
  });

  it('Should update available wallets correctly', () => {
    const wallet = getActiveWallets()[0];
    expect(isWalletAvailable(wallet)).to.be.true;

    setWalletAvailable(wallet, false);
    expect(isWalletAvailable(wallet)).to.be.false;

    setWalletAvailable(wallet, true);
    expect(isWalletAvailable(wallet)).to.be.true;
  });
}).timeout(10000);
