import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber, Wallet as EthersWallet } from 'ethers';
import sinon, { SinonStub } from 'sinon';
import {
  FallbackProvider,
  TransactionResponse,
} from '@ethersproject/providers';
import {
  createEthersWallet,
  getActiveWallets,
  getRailgunWalletKeypair,
} from '../../wallets/active-wallets';
import {
  executeTransaction,
  getCurrentNonce,
  LAST_NONCE_KEY,
  storeCurrentNonce,
  waitForTx,
} from '../execute-transaction';
import {
  getMockPopulatedTransaction,
  getMockProvider,
  getMockRopstenNetwork,
} from '../../../test/mocks.test';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { initLepton } from '../../lepton/lepton-init';
import {
  clearSettingsDB,
  getSettingsNumber,
  initSettingsDB,
} from '../../db/settings-db';
import { NetworkChainID } from '../../config/config-chain-ids';
import { TransactionGasDetails } from '../../fees/calculate-transaction-gas';
import { delay } from '../../../util/promise-utils';
import * as ExecuteTransactionModule from '../execute-transaction';
import * as BestWalletMatchModule from '../../wallets/best-match-wallet';
import { ActiveWallet } from '../../../models/wallet-models';
import { isWalletAvailable } from '../../wallets/available-wallets';
import { initNetworkProviders } from '../../providers/active-network-providers';
import configNetworks from '../../config/config-networks';

chai.use(chaiAsPromised);
const { expect } = chai;

let activeWallet: ActiveWallet;
let ethersWallet: EthersWallet;

let walletGetTransactionCountStub: SinonStub;
let sendTransactionStub: SinonStub;
let waitTxStub: SinonStub;
let getBestMatchWalletForNetwork: SinonStub;

describe('execute-transaction', () => {
  before(async () => {
    initLepton();
    initSettingsDB();
    clearSettingsDB();
    await setupSingleTestWallet();
    [activeWallet] = getActiveWallets();
    configNetworks[NetworkChainID.Ropsten] = getMockRopstenNetwork();
    initNetworkProviders();
    ethersWallet = createEthersWallet(activeWallet, getMockProvider());
    walletGetTransactionCountStub = sinon
      .stub(EthersWallet.prototype, 'getTransactionCount')
      .resolves(3);
    sendTransactionStub = sinon
      .stub(FallbackProvider.prototype, 'sendTransaction')
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

  after(() => {
    walletGetTransactionCountStub.restore();
    sendTransactionStub.restore();
    waitTxStub.restore();
    getBestMatchWalletForNetwork.restore();
  });

  it('Should get and store nonce values', async () => {
    const railgunWalletPubKey = getRailgunWalletKeypair(0).pubkey;
    expect(await getSettingsNumber(`${LAST_NONCE_KEY}|${railgunWalletPubKey}`))
      .to.be.undefined;

    let currentNonce: number;
    currentNonce = await getCurrentNonce(ethersWallet);
    expect(currentNonce).to.equal(3);

    await storeCurrentNonce(24);
    expect(
      await getSettingsNumber(`${LAST_NONCE_KEY}|${railgunWalletPubKey}`),
    ).to.equal(24);
    currentNonce = await getCurrentNonce(ethersWallet);
    expect(currentNonce).to.equal(25); // 24 + 1
  });

  it('Should process and sign a transaction', async () => {
    const populatedTransaction = getMockPopulatedTransaction();

    const gasDetails: TransactionGasDetails = {
      gasLimit: BigNumber.from(10),
      gasPrice: BigNumber.from(10),
    };
    const txResponse = await executeTransaction(
      NetworkChainID.Ropsten,
      populatedTransaction,
      gasDetails,
    );
    expect(txResponse.hash).to.equal('123');
    // Delay of 10 set in waitTxStub - wait until it finishes.
    await delay(15);
  });

  it('Should set wallet unavailable while processing tx', async () => {
    expect(isWalletAvailable(activeWallet)).to.be.true;
    waitForTx(activeWallet, {} as TransactionResponse);
    expect(isWalletAvailable(activeWallet)).to.be.false;
    // Delay of 10 set in waitTxStub
    await delay(15);
    expect(isWalletAvailable(activeWallet)).to.be.true;
  });
}).timeout(120000);
