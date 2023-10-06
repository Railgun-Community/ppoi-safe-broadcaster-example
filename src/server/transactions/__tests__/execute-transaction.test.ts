import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Wallet as EthersWallet, TransactionResponse } from 'ethers';
import sinon, { SinonStub } from 'sinon';
import {
  createEthersWallet,
  getActiveWallets,
} from '../../wallets/active-wallets';
import {
  executeTransaction,
  getCurrentNonce,
  getLastNonceKey,
  storeCurrentNonce,
  waitForTx,
} from '../execute-transaction';
import {
  getMockContractTransaction,
  getMockProvider,
  getMockGoerliNetwork,
} from '../../../test/mocks.test';
import {
  setupSingleTestWallet,
  testChainGoerli,
} from '../../../test/setup.test';
import { startEngine } from '../../engine/engine-init';
import {
  clearSettingsDB,
  getSettingsNumber,
  initSettingsDB,
} from '../../db/settings-db';
import { delay } from '../../../util/promise-utils';
import * as ExecuteTransactionModule from '../execute-transaction';
import * as BestWalletMatchModule from '../../wallets/best-match-wallet';
import { ActiveWallet } from '../../../models/wallet-models';
import { isWalletAvailableWithEnoughFunds } from '../../wallets/available-wallets';
import { initNetworkProviders } from '../../providers/active-network-providers';
import configNetworks from '../../config/config-networks';
import {
  createGasBalanceStub,
  restoreGasBalanceStub,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { resetGasTokenBalanceCache } from '../../balances/balance-cache';
import {
  TransactionGasDetails,
  EVMGasType,
} from '@railgun-community/shared-models';

chai.use(chaiAsPromised);
const { expect } = chai;

let activeWallet: ActiveWallet;
let ethersWallet: EthersWallet;

let walletGetTransactionCountStub: SinonStub;
let sendTransactionStub: SinonStub;
let waitTxStub: SinonStub;
let getBestMatchWalletForNetwork: SinonStub;

const MOCK_CHAIN = testChainGoerli();

describe('execute-transaction', () => {
  before(async () => {
    startEngine();
    initSettingsDB();
    await clearSettingsDB();
    await setupSingleTestWallet();
    [activeWallet] = getActiveWallets();
    configNetworks[testChainGoerli().type][testChainGoerli().id] =
      getMockGoerliNetwork();
    await initNetworkProviders([testChainGoerli()]);
    ethersWallet = createEthersWallet(activeWallet, getMockProvider());
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
  });

  it.skip('Should get and store nonce values', async () => {
    let currentNonce: number;
    currentNonce = await getCurrentNonce(MOCK_CHAIN, ethersWallet);
    expect(currentNonce).to.equal(3);

    await storeCurrentNonce(MOCK_CHAIN, 24, ethersWallet);
    expect(
      await getSettingsNumber(getLastNonceKey(MOCK_CHAIN, ethersWallet)),
    ).to.equal(24);
    currentNonce = await getCurrentNonce(MOCK_CHAIN, ethersWallet);
    expect(currentNonce).to.equal(25); // 24 + 1
  }).timeout(31000);

  it('Should process and sign a transaction', async () => {
    const populatedTransaction = getMockContractTransaction();

    const gasDetails: TransactionGasDetails = {
      evmGasType: EVMGasType.Type2,
      gasEstimate: 10n,
      maxFeePerGas: 20n,
      maxPriorityFeePerGas: 30n,
    };
    const txResponse = await executeTransaction(
      MOCK_CHAIN,
      populatedTransaction,
      gasDetails,
    );
    expect(txResponse.hash).to.equal('123');
    // Delay of 10 set in waitTxStub - wait until it finishes.
    await delay(15);
  });

  it.skip('Should set wallet unavailable while processing tx', async () => {
    createGasBalanceStub(10n ** 18n);
    expect(await isWalletAvailableWithEnoughFunds(activeWallet, MOCK_CHAIN)).to
      .be.true;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    waitForTx(
      activeWallet,
      ethersWallet,
      MOCK_CHAIN,
      {} as TransactionResponse,
      0,
    );
    expect(await isWalletAvailableWithEnoughFunds(activeWallet, MOCK_CHAIN)).to
      .be.false;
    // Delay of 10 set in waitTxStub
    await delay(50);
    expect(await isWalletAvailableWithEnoughFunds(activeWallet, MOCK_CHAIN)).to
      .be.true;
  });
}).timeout(120000);
