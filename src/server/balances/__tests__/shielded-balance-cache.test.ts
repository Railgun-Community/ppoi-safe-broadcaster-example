import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../config/config-chains';
import {
  getPrivateTokenBalanceCache,
  updateCachedShieldedBalances,
} from '../shielded-balance-cache';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { BigNumber } from '@ethersproject/bignumber';
import { getRailgunWallet } from '../../wallets/active-wallets';
import { getMockToken } from '../../../test/mocks.test';
import { initEngine } from '../../lepton/lepton-init';
import { ChainType } from '@railgun-community/engine';
import {
  restoreEngineStubs,
  createEngineWalletBalancesStub,
} from '../../../test/stubs/lepton-stubs.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = {
  type: ChainType.EVM,
  id: NetworkChainID.Ethereum,
};

const MOCK_TOKEN_AMOUNT = BigNumber.from('1000000000000000000000');

describe('shielded-balance-cache', () => {
  before(async () => {
    initEngine();
    await setupSingleTestWallet();
  });

  it('Should find no private token balances', () => {
    expect(getPrivateTokenBalanceCache(MOCK_CHAIN)).to.deep.equal([]);
  });

  it('Should pull private token balance of live wallet', async () => {
    const wallet = getRailgunWallet();
    await createEngineWalletBalancesStub(getMockToken().address, 0);
    await updateCachedShieldedBalances(wallet, MOCK_CHAIN);
    const mockBalance =
      getPrivateTokenBalanceCache(MOCK_CHAIN)[0].tokenAmount.amount;
    expect(mockBalance.toBigInt()).to.equal(MOCK_TOKEN_AMOUNT.toBigInt());
    restoreEngineStubs();
  });
}).timeout(30000);
