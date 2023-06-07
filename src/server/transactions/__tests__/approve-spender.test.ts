import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Wallet as EthersWallet, TransactionResponse } from 'ethers';
import sinon, { SinonStub } from 'sinon';
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
import { resetGasTokenBalanceCache } from '../../balances/balance-cache';
import { generateApprovalTransactions, approveZeroX } from '../approve-spender';

chai.use(chaiAsPromised);
const { expect } = chai;

let activeWallet: ActiveWallet;
let walletGetTransactionCountStub: SinonStub;
let sendTransactionStub: SinonStub;
let waitTxStub: SinonStub;
let getBestMatchWalletForNetwork: SinonStub;

const MOCK_TOKEN_ADDRESS = getMockToken().address;

const MOCK_TOKEN_AMOUNT_1 = {
  tokenAddress: MOCK_TOKEN_ADDRESS,
  amount: BigInt('100000000000000'),
};
const MOCK_TOKEN_AMOUNT_2 = {
  tokenAddress: '0xe76C6c83af64e4C60245D8C7dE953DF673a7A33D',
  amount: BigInt('200000000000000'),
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
      .stub(EthersWallet.prototype, 'getNonce')
      .resolves(3);
    sendTransactionStub = sinon
      .stub(EthersWallet.prototype, 'sendTransaction')
      .resolves({ hash: '123' } as TransactionResponse);
    waitTxStub = sinon
      .stub(ExecuteTransactionModule, 'waitTx')
      .callsFake(async () => {
        await delay(10);
      });
    getBestMatchWalletForNetwork = sinon
      .stub(BestWalletMatchModule, 'getBestMatchWalletForNetwork')
      .resolves(activeWallet);
    const gasEstimate = 1000n;
    const maxFeePerGas = BigInt(90);
    const maxPriorityFeePerGas = 10n;
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
    getBestMatchWalletForNetwork.restore();
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
