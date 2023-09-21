import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Wallet as EthersWallet, TransactionResponse } from 'ethers';
import sinon, { SinonStub } from 'sinon';
import { getActiveWallets } from '../../wallets/active-wallets';
import {
  getMockGoerliNetwork,
  getMockNetwork,
  getMockToken,
} from '../../../test/mocks.test';
import {
  setupSingleTestWallet,
  testChainEthereum,
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
import { generateSwapTransactions, swapZeroX } from '../0x-swap';
import { zeroXExchangeProxyContractAddress } from '../../api/0x/0x-quote';

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
const TO_SWAP = [MOCK_TOKEN_AMOUNT_1, MOCK_TOKEN_AMOUNT_2];

const MOCK_LOW_LIQUIDITY_CHAIN = testChainGoerli();
const MOCK_CHAIN = testChainEthereum();

describe('0x-swap', () => {
  before(async () => {
    startEngine();
    initSettingsDB();
    await clearSettingsDB();
    await setupSingleTestWallet();
    [activeWallet] = getActiveWallets();
    configNetworks[MOCK_LOW_LIQUIDITY_CHAIN.type][MOCK_LOW_LIQUIDITY_CHAIN.id] =
      getMockGoerliNetwork();
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockNetwork();
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
  it('Should not generate swap transactions for illiquid tokens', async () => {
    const swapTxs = await generateSwapTransactions(
      TO_SWAP,
      MOCK_LOW_LIQUIDITY_CHAIN,
      '0x00',
    );
    expect(swapTxs.length).to.equal(0);
  }).timeout(200000);

  // Skip: Hitting 429s.
  it.skip(
    'Should generate the correct number of swap transactions',
    async () => {
      const swapTxs = await generateSwapTransactions(
        TO_SWAP,
        MOCK_CHAIN,
        '0x00',
      );
      expect(swapTxs.length).to.equal(2);
    },
  ).timeout(200000);

  // Skip: Hitting 429s.
  it.skip('Should generate approval transactions to each token', async () => {
    const swapTxs = await generateSwapTransactions(TO_SWAP, MOCK_CHAIN, '0x00');
    expect(swapTxs.length).to.equal(2);
    expect(swapTxs[0].to).to.equal(
      zeroXExchangeProxyContractAddress(MOCK_CHAIN),
    );
    expect(swapTxs[1].to).to.equal(
      zeroXExchangeProxyContractAddress(MOCK_CHAIN),
    );
  }).timeout(200000);

  // Skip: Hitting 429s.
  it.skip('Should generate transactions with expected hash', async () => {
    const txReceipts = await swapZeroX(activeWallet, TO_SWAP, MOCK_CHAIN);
    expect(txReceipts.length).to.equal(2);
    expect(txReceipts[0].hash).to.equal('123');
    expect(txReceipts[1].hash).to.equal('123');
  }).timeout(200000);
});
