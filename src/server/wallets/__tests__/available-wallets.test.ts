import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import {
  setupSingleTestWallet,
  testChainEthereum,
} from '../../../test/setup.test';
import { initLepton } from '../../lepton/lepton-init';
import {
  isWalletAvailableWithEnoughFunds,
  setWalletAvailability,
} from '../available-wallets';
import { getActiveWallets, numAvailableWallets } from '../active-wallets';
import {
  createGasBalanceStub,
  restoreGasBalanceStub,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { resetGasTokenBalanceCache } from '../../balances/balance-cache';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('available-wallets', () => {
  before(async () => {
    initLepton();
    await setupSingleTestWallet();
    initNetworkProviders();
    resetGasTokenBalanceCache();
    createGasBalanceStub(
      BigNumber.from('100000000000000000000000000000000000'),
    );
  });
  after(() => {
    restoreGasBalanceStub();
  });

  it('Should update available wallets correctly', async () => {
    const chain = testChainEthereum();

    const wallet = getActiveWallets()[0];
    expect(await isWalletAvailableWithEnoughFunds(wallet, chain)).to.be.true;
    expect(await numAvailableWallets(chain)).to.equal(1);

    setWalletAvailability(wallet, chain, false);
    expect(await isWalletAvailableWithEnoughFunds(wallet, chain)).to.be.false;
    expect(await numAvailableWallets(chain)).to.equal(0);

    setWalletAvailability(wallet, chain, true);
    expect(await isWalletAvailableWithEnoughFunds(wallet, chain)).to.be.true;
    expect(await numAvailableWallets(chain)).to.equal(1);
  });
}).timeout(10000);
