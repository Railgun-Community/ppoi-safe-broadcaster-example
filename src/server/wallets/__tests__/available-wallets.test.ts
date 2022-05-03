import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { initLepton } from '../../lepton/lepton-init';
import { isWalletAvailable, setWalletAvailable } from '../available-wallets';
import { getActiveWallets, numAvailableWallets } from '../active-wallets';
import { NetworkChainID } from '../../config/config-chain-ids';
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
    createGasBalanceStub(BigNumber.from(10).pow(18));
  });
  after(() => {
    restoreGasBalanceStub();
  });

  it('Should update available wallets correctly', async () => {
    const chainID = NetworkChainID.Ropsten;

    const wallet = getActiveWallets()[0];
    expect(await isWalletAvailable(wallet, chainID)).to.be.true;
    expect(await numAvailableWallets(chainID)).to.equal(1);

    setWalletAvailable(wallet, chainID, false);
    expect(await isWalletAvailable(wallet, chainID)).to.be.false;
    expect(await numAvailableWallets(chainID)).to.equal(0);

    setWalletAvailable(wallet, chainID, true);
    expect(await isWalletAvailable(wallet, chainID)).to.be.true;
    expect(await numAvailableWallets(chainID)).to.equal(1);
  });
}).timeout(10000);
