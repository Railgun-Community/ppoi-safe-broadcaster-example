import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  getTopUpWallet,
  initTopUpPoller,
  stopTopUpPolling,
} from '../wallet-top-up-poller';
import { delay } from '../../../util/promise-utils';
import { resetAvailableWallets } from '../available-wallets';
import { BigNumber } from '@ethersproject/bignumber';
import configDefaults from '../../config/config-defaults';
import { getActiveWallets } from '../active-wallets';
import {
  resetConfigDefaults,
  setupSingleTestWallet,
  testChainEthereum,
} from '../../../test/setup.test';
import {
  createGasBalanceStub,
  restoreGasBalanceStub,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { resetGasTokenBalanceCache } from '../../balances/balance-cache';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = testChainEthereum();
const MOCK_WALLET_1_GAS_BALANCE = BigNumber.from('9000000000000000');
const MOCK_WALLET_2_GAS_BALANCE = BigNumber.from('1200000000000000000');

describe('wallet-top-up-poller', () => {
  before(async () => {
    configDefaults.topUps.shouldTopUp = true;
    resetGasTokenBalanceCache();
    resetAvailableWallets(MOCK_CHAIN);
    await setupSingleTestWallet();
  });

  after(() => {
    restoreGasBalanceStub();
    resetConfigDefaults();
  });

  it('Should return a wallet to top up', async () => {
    createGasBalanceStub(MOCK_WALLET_1_GAS_BALANCE);
    expect(await getTopUpWallet(MOCK_CHAIN)).to.not.be.undefined;
    resetGasTokenBalanceCache();
    restoreGasBalanceStub();
  });

  it('Should find no wallets to top up', async () => {
    createGasBalanceStub(MOCK_WALLET_2_GAS_BALANCE);
    expect(await getTopUpWallet(MOCK_CHAIN)).to.be.undefined;
    resetGasTokenBalanceCache();
    restoreGasBalanceStub();
  });

  it('Should find no active wallets during top up', async () => {
    createGasBalanceStub(MOCK_WALLET_1_GAS_BALANCE);
    initTopUpPoller();
    // Wait for async call to finish.
    await delay(10);
    stopTopUpPolling();
    expect(getActiveWallets.length).to.equal(0);
    restoreGasBalanceStub();
  });
}).timeout(20000);
