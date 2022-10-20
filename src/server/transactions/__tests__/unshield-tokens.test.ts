import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber, Wallet as EthersWallet } from 'ethers';
import sinon, { SinonStub } from 'sinon';
import {
  getActiveWallets,
  getRailgunWallet,
} from '../../wallets/active-wallets';
import { getMockGoerliNetwork, getMockToken } from '../../../test/mocks.test';
import {
  setupSingleTestWallet,
  testChainEthereum,
} from '../../../test/setup.test';
import { getRailgunEngine, initEngine } from '../../lepton/lepton-init';
import { clearSettingsDB, initSettingsDB } from '../../db/settings-db';
import * as BestWalletMatchModule from '../../wallets/best-match-wallet';
import { ActiveWallet } from '../../../models/wallet-models';
import { initNetworkProviders } from '../../providers/active-network-providers';
import configNetworks from '../../config/config-networks';
import { restoreGasBalanceStub } from '../../../test/stubs/ethers-provider-stubs.test';
import { resetGasTokenBalanceCache } from '../../balances/balance-cache';
import {
  generatePopulatedUnshieldTransact,
  generateUnshieldTransactions,
  getProxyContractForNetwork,
} from '../unshield-tokens';
import configDefaults from '../../config/config-defaults';
import {
  createEngineWalletTreeBalancesStub,
  restoreEngineStubs,
} from '../../../test/stubs/lepton-stubs.test';
import { ByteLength, nToHex } from '@railgun-community/engine';
import { Proof, Prover, PublicInputs } from '@railgun-community/engine';
import { RailgunWallet } from '@railgun-community/engine';

chai.use(chaiAsPromised);
const { expect } = chai;

let activeWallet: ActiveWallet;
let railWallet: RailgunWallet;

let walletGetTransactionCountStub: SinonStub;
let getBestMatchWalletForNetwork: SinonStub;
let railProveStub: SinonStub;

const MOCK_TOKEN_ADDRESS = getMockToken().address;

const MOCK_TOKEN_AMOUNT_1 = {
  tokenAddress: MOCK_TOKEN_ADDRESS,
  amount: BigNumber.from('100000000000000'),
};
const MOCK_TOKEN_AMOUNT_2 = {
  tokenAddress: 'xyz',
  amount: BigNumber.from('200000000000000'),
};
const TREE = 0;

const MOCK_CHAIN = testChainEthereum();

const zeroProof = (): Proof => {
  const zero = nToHex(BigInt(0), ByteLength.UINT_8);
  return {
    pi_a: [zero, zero],
    pi_b: [
      [zero, zero],
      [zero, zero],
    ],
    pi_c: [zero, zero],
  };
};

describe('unshield-tokens', () => {
  before(async () => {
    initEngine();
    initSettingsDB();
    clearSettingsDB();
    await setupSingleTestWallet();
    railWallet = getRailgunWallet();
    [activeWallet] = getActiveWallets();
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockGoerliNetwork();
    initNetworkProviders();
    walletGetTransactionCountStub = sinon
      .stub(EthersWallet.prototype, 'getTransactionCount')
      .resolves(3);
    getBestMatchWalletForNetwork = sinon
      .stub(BestWalletMatchModule, 'getBestMatchWalletForNetwork')
      .resolves(activeWallet);

    createEngineWalletTreeBalancesStub(MOCK_TOKEN_AMOUNT_1.tokenAddress, TREE);
    railProveStub = sinon
      .stub(Prover.prototype, 'prove')
      // eslint-disable-next-line require-await
      .callsFake(async (publicInputs: PublicInputs) => ({
        proof: zeroProof(),
        publicInputs,
      }));
  });

  afterEach(() => {
    resetGasTokenBalanceCache();
    restoreGasBalanceStub();
  });

  after(() => {
    walletGetTransactionCountStub.restore();
    getBestMatchWalletForNetwork.restore();
    restoreEngineStubs();
    railProveStub?.restore();
  });

  it('Should generate the correct number of serialized transactions', async () => {
    const { prover } = getRailgunEngine();

    const unshieldTransactions = await generateUnshieldTransactions(
      prover,
      railWallet,
      configDefaults.lepton.dbEncryptionKey,
      activeWallet.address,
      false, // allowOveride
      [MOCK_TOKEN_AMOUNT_1],
      MOCK_CHAIN,
    );
    expect(unshieldTransactions.length).to.equal(1);
  });

  it('Should fail with insufficient token balance', () => {
    const { prover } = getRailgunEngine();

    expect(
      generateUnshieldTransactions(
        prover,
        railWallet,
        configDefaults.lepton.dbEncryptionKey,
        activeWallet.address,
        false, // allowOveride
        [MOCK_TOKEN_AMOUNT_2],
        MOCK_CHAIN,
      ),
    ).to.be.rejectedWith('');
  });

  it.skip('Should generate populated transaction to railgun contract ready for execute transaction', async () => {
    const { prover } = getRailgunEngine();

    const unshieldTransactions = await generateUnshieldTransactions(
      prover,
      railWallet,
      configDefaults.lepton.dbEncryptionKey,
      activeWallet.address,
      false, // allowOveride
      [MOCK_TOKEN_AMOUNT_1],
      MOCK_CHAIN,
    );
    const populatedTransaction = await generatePopulatedUnshieldTransact(
      unshieldTransactions,
      MOCK_CHAIN,
    );
    const contractAddress = getProxyContractForNetwork(MOCK_CHAIN).address;

    expect(populatedTransaction.to?.toLowerCase()).to.equal(contractAddress);

    expect(populatedTransaction.from).to.be.undefined;
    expect(populatedTransaction.nonce).to.be.undefined;
  });
});
