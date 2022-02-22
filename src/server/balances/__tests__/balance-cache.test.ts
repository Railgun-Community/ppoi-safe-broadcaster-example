/* eslint-disable no-unused-expressions */
/* globals describe, it, before, after, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
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
import { initLepton } from '../../lepton/lepton-init';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_WALLET_ADDRESS = getMockWalletAddress();

const shouldUpdateEthWalletBalance = (address: string) => {
  return shouldUpdateCachedGasTokenBalance(NetworkChainID.Ethereum, address);
};

describe('balance-cache', () => {
  before(async () => {
    initLepton();
    await initWallets();
    initNetworkProviders();
    resetGasTokenBalanceCache();
    createGasBalanceStub(BigNumber.from(5000));
  });

  afterEach(() => {
    resetGasTokenBalanceCache();
  });

  after(() => {
    restoreGasBalanceStub();
  });

  it('Should update gas token balance cache for all chains', async () => {
    const firstWalletAddress = getActiveWallets()[0].address;

    await updateAllActiveWalletsGasTokenBalances();
    expect(shouldUpdateEthWalletBalance(firstWalletAddress)).to.be.false;
    const ethBalance = await getCachedGasTokenBalance(
      NetworkChainID.Ethereum,
      firstWalletAddress,
    );
    expect(ethBalance.toString()).to.equal('5000');
    const ropstenBalance = await getCachedGasTokenBalance(
      NetworkChainID.Ethereum,
      firstWalletAddress,
    );
    expect(ropstenBalance.toString()).to.equal('5000');
  });

  it('Should only refresh balances when necessary', async () => {
    configDefaults.balances.gasTokenBalanceCacheTTLInMS = 10;
    expect(shouldUpdateEthWalletBalance(MOCK_WALLET_ADDRESS)).to.be.true;
    await updateCachedGasTokenBalance(
      NetworkChainID.Ethereum,
      MOCK_WALLET_ADDRESS,
    );
    expect(shouldUpdateEthWalletBalance(MOCK_WALLET_ADDRESS)).to.be.false;

    await delay(11);
    expect(shouldUpdateEthWalletBalance(MOCK_WALLET_ADDRESS)).to.be.true;

    await getCachedGasTokenBalance(
      NetworkChainID.Ethereum,
      MOCK_WALLET_ADDRESS,
    );
    expect(shouldUpdateEthWalletBalance(MOCK_WALLET_ADDRESS)).to.be.false;
  });
}).timeout(30000);
