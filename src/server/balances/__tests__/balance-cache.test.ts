import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { initNetworkProviders } from '../../providers/active-network-providers';
import {
  getCachedGasTokenBalance,
  resetGasTokenBalanceCache,
  shouldUpdateCachedGasTokenBalance,
  updateAllActiveWalletsGasTokenBalances,
  updateCachedGasTokenBalance,
} from '../balance-cache';
import configDefaults from '../../config/config-defaults';
import {
  createGasBalanceStub,
  restoreGasBalanceStub,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { getMockWalletAddress } from '../../../test/mocks.test';
import { getActiveWallets, initWallets } from '../../wallets/active-wallets';
import { delay } from '../../../util/promise-utils';
import { startEngine } from '../../engine/engine-init';
import { testChainEthereum } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_WALLET_ADDRESS = getMockWalletAddress();

const MOCK_CHAIN = testChainEthereum();

const shouldUpdateEthWalletBalance = (address: string) => {
  return shouldUpdateCachedGasTokenBalance(MOCK_CHAIN, address);
};

describe('balance-cache', () => {
  before(async () => {
    await startEngine();
    await initWallets();
    await initNetworkProviders([MOCK_CHAIN]);
    resetGasTokenBalanceCache();
    createGasBalanceStub(BigInt(5000));
  });

  afterEach(() => {
    resetGasTokenBalanceCache();
  });

  after(() => {
    restoreGasBalanceStub();
  });

  it('Should update gas token balance cache for all chains', async () => {
    const activeWallets = getActiveWallets();
    const firstWalletAddress = activeWallets[0].address;
    await updateAllActiveWalletsGasTokenBalances(activeWallets);
    expect(shouldUpdateEthWalletBalance(firstWalletAddress)).to.be.false;
    const ethBalance = await getCachedGasTokenBalance(
      MOCK_CHAIN,
      firstWalletAddress,
    );
    expect(ethBalance.toString()).to.equal('5000');
    const ropstenBalance = await getCachedGasTokenBalance(
      MOCK_CHAIN,
      firstWalletAddress,
    );
    expect(ropstenBalance.toString()).to.equal('5000'); // asert
  });

  it('Should only refresh balances when necessary', async () => {
    configDefaults.balances.gasTokenBalanceCacheTTLInMS = 1000;
    expect(shouldUpdateEthWalletBalance(MOCK_WALLET_ADDRESS)).to.be.true;
    await updateCachedGasTokenBalance(MOCK_CHAIN, MOCK_WALLET_ADDRESS);
    expect(shouldUpdateEthWalletBalance(MOCK_WALLET_ADDRESS)).to.be.false;

    await delay(1500);
    const shouldUpdate = shouldUpdateEthWalletBalance(MOCK_WALLET_ADDRESS);
    expect(shouldUpdate).to.be.true;
    await delay(1500);
    await getCachedGasTokenBalance(MOCK_CHAIN, MOCK_WALLET_ADDRESS);
    await delay(100);
    expect(shouldUpdateEthWalletBalance(MOCK_WALLET_ADDRESS)).to.be.false;
  });
}).timeout(30000);
