import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  setupSingleTestWallet,
  testChainHardhat,
} from '../../../test/setup.test';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { initContracts } from '../../contracts/init-contracts';
import {
  depositToPaymaster,
  withdrawFromPaymaster,
} from '../paymaster-deposit-withdraw';
import { getActiveWallets } from '../../wallets/active-wallets';
import { BigNumber } from '@ethersproject/bignumber';
import { PaymasterWallet } from '../../wallets/paymaster-wallet';
import { startEngine } from '../../engine/engine-init';
import { resetPaymasterGasBalanceCache } from '../../balances/paymaster-gas-balance-cache';
import { JsonRpcProvider } from '@ethersproject/providers';
import { getJsonRPCProviderHardhat } from '../../../test/mocks.test';

chai.use(chaiAsPromised);
const { expect } = chai;

// TODO: Change to ethereum once paymaster is deployed.
const chain = testChainHardhat();

let snapshot: number;
let provider: JsonRpcProvider;

describe.only('paymaster-deposit-withdraw', () => {
  before(async () => {
    startEngine();
    await initNetworkProviders([chain]);
    initContracts([chain]);
    await setupSingleTestWallet();
    provider = getJsonRPCProviderHardhat();
  });

  beforeEach(async () => {
    snapshot = (await provider.send('evm_snapshot', [])) as number;
  });

  afterEach(async () => {
    resetPaymasterGasBalanceCache();
    await provider.send('evm_revert', [snapshot]);
  });

  it('[HH] Should deposit and withdraw from paymaster balance', async function run() {
    if (!process.env.RUN_HARDHAT_TESTS) {
      this.skip();
      return;
    }

    const firstActiveWallet = getActiveWallets()[0];

    // Deposit 1 ETH to paymaster.
    const depositAmount = BigNumber.from(10).pow(18);

    await depositToPaymaster(chain, firstActiveWallet, depositAmount);

    const paymasterBalanceAfterDeposit = await PaymasterWallet.getGasBalance(
      chain,
    );
    expect(paymasterBalanceAfterDeposit.toString()).to.equal(
      depositAmount.toString(),
    );

    // Withdraw 0.1 ETH from paymaster.
    const withdrawAmount = BigNumber.from(10).pow(17);

    await withdrawFromPaymaster(chain, withdrawAmount);

    const paymasterBalanceAfterWithdraw = await PaymasterWallet.getGasBalance(
      chain,
    );

    // Result should be 0.9 ETH.
    const resultingBalance = depositAmount.sub(withdrawAmount);
    expect(paymasterBalanceAfterWithdraw.toString()).to.equal(
      resultingBalance.toString(),
    );
  });
});
