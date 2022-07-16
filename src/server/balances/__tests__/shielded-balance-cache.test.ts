import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../config/config-chain-ids';
import {
  getPrivateTokenBalanceCache,
  updateCachedShieldedBalances,
} from '../shielded-balance-cache';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { BigNumber } from '@ethersproject/bignumber';
import { getRailgunWallet } from '../../wallets/active-wallets';
import { getMockToken } from '../../../test/mocks.test';
import {
  createLeptonWalletBalancesStub,
  restoreLeptonStubs,
} from '../../../test/stubs/lepton-stubs.test';
import { initLepton } from '../../lepton/lepton-init';

chai.use(chaiAsPromised);
const { expect } = chai;

let railWallet: RailgunWallet;

const MOCK_CHAIN_ID = NetworkChainID.Ethereum;

const MOCK_TOKEN_ADDRESS = getMockToken().address;

const MOCK_TOKEN_AMOUNT = {
  tokenAddress: MOCK_TOKEN_ADDRESS,
  amount: BigNumber.from('1000000000000000000000'),
};

const TREE = 0;

describe('shielded-token-balance-cache', () => {
  before(async () => {
    initLepton();
    // initSettingsDB();
    // clearSettingsDB();
    await setupSingleTestWallet();
    railWallet = getRailgunWallet();
    await setupSingleTestWallet();
  });
  after(() => {
    restoreLeptonStubs();
  });

  it('Should find no private token balances', () => {
    expect(getPrivateTokenBalanceCache(MOCK_CHAIN_ID)).to.be.undefined;
  });

  it('Should pull private token balance of live wallet', async () => {
    createLeptonWalletBalancesStub(MOCK_TOKEN_AMOUNT.tokenAddress, TREE);
    await updateCachedShieldedBalances(railWallet, MOCK_CHAIN_ID);
    const mockBalance =
      getPrivateTokenBalanceCache(MOCK_CHAIN_ID)[0].tokenAmount.amount;
    expect(mockBalance.toBigInt).to.equal(MOCK_TOKEN_AMOUNT.amount.toBigInt);
  });
}).timeout(30000);
