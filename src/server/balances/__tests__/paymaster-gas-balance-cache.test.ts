/// <reference types="../../../global" />
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from '@ethersproject/bignumber';
import { initNetworkProviders } from '../../providers/active-network-providers';
import {
  getCachedPaymasterGasBalance,
  resetPaymasterGasBalanceCache,
  shouldUpdateCachedPaymasterGasBalance,
  updateCachedPaymasterGasBalance,
} from '../paymaster-gas-balance-cache';
import configDefaults from '../../config/config-defaults';
import { restoreGasBalanceStub } from '../../../test/stubs/ethers-provider-stubs.test';
import {
  getJsonRPCProviderHardhat,
  getMockWalletAddress,
} from '../../../test/mocks.test';
import { getActiveWallets, initWallets } from '../../wallets/active-wallets';
import { delay } from '../../../util/promise-utils';
import { startEngine } from '../../engine/engine-init';
import { testChainHardhat } from '../../../test/setup.test';
import { initContracts } from '../../contracts/init-contracts';
import { PaymasterWallet } from '../../wallets/paymaster-wallet';
import { depositToPaymaster } from '../../paymaster/paymaster-deposit-withdraw';
import { ActiveWallet } from '../../../models/wallet-models';
import { JsonRpcProvider } from '@ethersproject/providers';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_WALLET_ADDRESS = getMockWalletAddress();
let firstActiveWallet: ActiveWallet;

// TODO: Change to ethereum once paymaster is deployed.
const chain = testChainHardhat();

let snapshot: number;
let provider: JsonRpcProvider;

describe.only('paymaster-gas-balance-cache', () => {
  before(async () => {
    startEngine();
    await initWallets();
    await initNetworkProviders([chain]);
    initContracts([chain]);
    resetPaymasterGasBalanceCache();

    [firstActiveWallet] = getActiveWallets();

    provider = getJsonRPCProviderHardhat();
  });

  beforeEach(async () => {
    snapshot = (await provider.send('evm_snapshot', [])) as number;
    await (
      await depositToPaymaster(chain, firstActiveWallet, BigNumber.from(5000))
    ).wait();
  });

  afterEach(async () => {
    resetPaymasterGasBalanceCache();
    await provider.send('evm_revert', [snapshot]);
  });

  after(() => {
    restoreGasBalanceStub();
  });

  it('[HH] Should update paymaster gas token balance cache for all chains', async function run() {
    if (!process.env.RUN_HARDHAT_TESTS) {
      this.skip();
      return;
    }

    const firstWalletAddress = firstActiveWallet.address;

    await updateCachedPaymasterGasBalance(chain, firstWalletAddress);
    expect(shouldUpdateCachedPaymasterGasBalance(chain, firstWalletAddress)).to
      .be.false;
    const balance = await getCachedPaymasterGasBalance(
      chain,
      firstWalletAddress,
    );
    expect(balance.toString()).to.equal('5000');
    const hasEnoughGasLow = await PaymasterWallet.hasEnoughPaymasterGas(
      chain,
      BigNumber.from('4999'),
    );
    expect(hasEnoughGasLow).to.equal(true);
    const hasEnoughGasHigh = await PaymasterWallet.hasEnoughPaymasterGas(
      chain,
      BigNumber.from('5001'),
    );
    expect(hasEnoughGasHigh).to.equal(false);
  }).timeout(10000);

  it('[HH] Should only refresh paymaster balances when necessary', async function run() {
    if (!process.env.RUN_HARDHAT_TESTS) {
      this.skip();
      return;
    }

    configDefaults.paymaster.gasBalanceCacheTTLInMS = 10;
    expect(shouldUpdateCachedPaymasterGasBalance(chain, MOCK_WALLET_ADDRESS)).to
      .be.true;
    await updateCachedPaymasterGasBalance(chain, MOCK_WALLET_ADDRESS);
    expect(shouldUpdateCachedPaymasterGasBalance(chain, MOCK_WALLET_ADDRESS)).to
      .be.false;

    await delay(15);
    expect(shouldUpdateCachedPaymasterGasBalance(chain, MOCK_WALLET_ADDRESS)).to
      .be.true;

    await getCachedPaymasterGasBalance(chain, MOCK_WALLET_ADDRESS);
    expect(shouldUpdateCachedPaymasterGasBalance(chain, MOCK_WALLET_ADDRESS)).to
      .be.false;
  }).timeout(10000);
});
