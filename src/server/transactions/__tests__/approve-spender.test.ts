import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import {
  FallbackProvider,
  TransactionResponse,
} from '@ethersproject/providers';
import { getActiveWallets } from '../../wallets/active-wallets';
import { getMockGoerliNetwork, getMockToken } from '../../../test/mocks.test';
import {
  setupSingleTestWallet,
  testChainGoerli,
} from '../../../test/setup.test';
import { startEngine } from '../../engine/engine-init';
import { clearSettingsDB, initSettingsDB } from '../../db/settings-db';
import { delay } from '../../../util/promise-utils';
import * as ExecuteTransactionModule from '../execute-transaction';
import * as BestWalletMatchModule from '../../wallets/best-match-wallet';
import { ActiveWallet } from '../../../models/wallet-models';
import { initNetworkProviders } from '../../providers/active-network-providers';
import configNetworks from '../../config/config-networks';
import {
  createGasEstimateStubs,
  restoreGasBalanceStub,
  restoreGasEstimateStubs,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { resetGasTokenBalanceCache } from '../../balances/gas-balance-cache';
import { generateApprovalTransactions, approveZeroX } from '../approve-spender';
import { BigNumber } from '@ethersproject/bignumber';
import { Wallet } from '@ethersproject/wallet';

chai.use(chaiAsPromised);
const { expect } = chai;

let activeWallet: ActiveWallet;
let walletGetTransactionCountStub: SinonStub;
let sendTransactionStub: SinonStub;
let waitTxStub: SinonStub;
let getBestMatchAvailableWalletForNetwork: SinonStub;

const MOCK_TOKEN_ADDRESS = getMockToken().address;

const MOCK_TOKEN_AMOUNT_1 = {
  tokenAddress: MOCK_TOKEN_ADDRESS,
  amount: BigNumber.from('100000000000000'),
};
const MOCK_TOKEN_AMOUNT_2 = {
  tokenAddress: '0xe76C6c83af64e4C60245D8C7dE953DF673a7A33D',
  amount: BigNumber.from('200000000000000'),
};
const TO_APPROVE = [MOCK_TOKEN_AMOUNT_1, MOCK_TOKEN_AMOUNT_2];

const MOCK_CHAIN = testChainGoerli();

describe('approve-spender', () => {
  before(async () => {
    startEngine();
    initSettingsDB();
    await clearSettingsDB();
    await setupSingleTestWallet();
    [activeWallet] = getActiveWallets();
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockGoerliNetwork();
    await initNetworkProviders([MOCK_CHAIN]);
    walletGetTransactionCountStub = sinon
      .stub(Wallet.prototype, 'getTransactionCount')
      .resolves(3);
    sendTransactionStub = sinon
      .stub(FallbackProvider.prototype, 'sendTransaction')
      .resolves({ hash: '123' } as TransactionResponse);
    waitTxStub = sinon
      .stub(ExecuteTransactionModule, 'waitTx')
      .callsFake(async () => {
        await delay(10);
      });
    getBestMatchAvailableWalletForNetwork = sinon
      .stub(BestWalletMatchModule, 'getBestMatchAvailableWalletForNetwork')
      .resolves(activeWallet);
    const gasEstimate = BigNumber.from(1000);
    const maxFeePerGas = BigNumber.from(90);
    const maxPriorityFeePerGas = BigNumber.from(10);
    createGasEstimateStubs(gasEstimate, maxFeePerGas, maxPriorityFeePerGas);
  });

  afterEach(() => {
    resetGasTokenBalanceCache();
    restoreGasBalanceStub();
  });

  after(() => {
    walletGetTransactionCountStub.restore();
    sendTransactionStub.restore();
    waitTxStub.restore();
    getBestMatchAvailableWalletForNetwork.restore();
    restoreGasEstimateStubs();
  });

  it('Should generate the correct number of approval transactions', async () => {
    const approvalTxs = await generateApprovalTransactions(
      TO_APPROVE,
      MOCK_CHAIN,
    );
    expect(approvalTxs.length).to.equal(2);
  });

  it('Should generate approval transactions to each token', async () => {
    const approvalTxs = await generateApprovalTransactions(
      TO_APPROVE,
      MOCK_CHAIN,
    );
    expect(approvalTxs[0].to).to.equal(TO_APPROVE[0].tokenAddress);
    expect(approvalTxs[1].to).to.equal(TO_APPROVE[1].tokenAddress);
  });

  it('Should generate transactions with expected hash', async () => {
    const txReceipts = await approveZeroX(activeWallet, TO_APPROVE, MOCK_CHAIN);
    expect(txReceipts[0].hash).to.equal('123');
    expect(txReceipts[1].hash).to.equal('123');
  });
});
