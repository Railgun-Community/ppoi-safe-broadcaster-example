/* globals describe, before, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { initLepton } from '../../lepton/lepton-init';
import {
  createEthersWallet,
  getActiveWallets,
  initWallets,
} from '../active-wallets';
import { getBestMatchWalletForNetwork } from '../best-match-wallet';
import configWallets from '../../../config/config-wallets';
import { WalletConfig } from '../../../models/wallet-models';
import { BigNumber, Wallet as EthersWallet } from 'ethers';
import { NetworkChainID } from '../../../config/config-chain-ids';
import {
  resetAvailableWallets,
  setWalletAvailable,
} from '../available-wallets';
import { getMockProvider } from '../../../test/mocks.test';
import sinon, { SinonStub } from 'sinon';
import * as BalanceCacheModule from '../../balances/balance-cache';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN_ID = NetworkChainID.Ethereum;
const MOCK_MNEMONIC_1 =
  'hint profit virus forest angry puzzle index same feel behind grant repair';
const MOCK_MNEMONIC_2 =
  'sense arena duck shine near cluster awful gravity act security cargo knock';
const MOCK_MNEMONIC_3 =
  'odor crucial flip innocent train smile jump pair agent cabbage gun never';

let getCachedGasTokenBalanceStub: SinonStub;

const setupMockWallets = async (wallets: WalletConfig[]) => {
  configWallets.wallets = wallets;
  await initWallets();
};

const addressForMnemonic = (mnemonic: string): string => {
  const ethersWallet = EthersWallet.fromMnemonic(mnemonic);
  return ethersWallet.address;
};

describe('best-match-wallet', () => {
  before(async () => {
    initLepton();
    getCachedGasTokenBalanceStub = sinon
      .stub(BalanceCacheModule, 'getCachedGasTokenBalance')
      .resolves(BigNumber.from(500));
  });

  afterEach(() => {
    resetAvailableWallets();
  });

  after(() => {
    getCachedGasTokenBalanceStub.restore();
  });

  it('Should select best match wallet ordered by priority', async () => {
    await setupMockWallets([
      {
        mnemonic: MOCK_MNEMONIC_1,
        priority: 3,
        isShieldedReceiver: true,
      },
      {
        mnemonic: MOCK_MNEMONIC_2,
        priority: 2,
      },
      {
        mnemonic: MOCK_MNEMONIC_3,
        priority: 1,
      },
    ]);

    const bestWallet = await getBestMatchWalletForNetwork(
      MOCK_CHAIN_ID,
      BigNumber.from(100),
    );
    expect(bestWallet.address).to.equal(addressForMnemonic(MOCK_MNEMONIC_3));
  });

  it('Should skip unavailable wallets when selecting best match', async () => {
    await setupMockWallets([
      {
        mnemonic: MOCK_MNEMONIC_1,
        priority: 1,
        isShieldedReceiver: true,
      },
      {
        mnemonic: MOCK_MNEMONIC_2,
        priority: 2,
      },
      {
        mnemonic: MOCK_MNEMONIC_3,
        priority: 1,
      },
    ]);

    const firstActiveWallet = getActiveWallets()[0];
    const firstWallet = createEthersWallet(
      firstActiveWallet,
      getMockProvider(),
    );
    expect(firstWallet.address).to.equal(addressForMnemonic(MOCK_MNEMONIC_1));
    setWalletAvailable(firstActiveWallet, false);

    const bestWallet = await getBestMatchWalletForNetwork(
      MOCK_CHAIN_ID,
      BigNumber.from(100),
    );
    expect(bestWallet.address).to.equal(addressForMnemonic(MOCK_MNEMONIC_3));
  });

  it('Should error if all wallets unavailable', async () => {
    await setupMockWallets([
      {
        mnemonic: MOCK_MNEMONIC_1,
        priority: 1,
        isShieldedReceiver: true,
      },
    ]);

    const firstWallet = getActiveWallets()[0];
    setWalletAvailable(firstWallet, false);

    await expect(
      getBestMatchWalletForNetwork(MOCK_CHAIN_ID, BigNumber.from(100)),
    ).to.be.rejectedWith('All wallets busy or out of funds.');
  });

  it('Should error if all wallets out of funds', async () => {
    await setupMockWallets([
      {
        mnemonic: MOCK_MNEMONIC_1,
        priority: 1,
        isShieldedReceiver: true,
      },
    ]);

    await expect(
      getBestMatchWalletForNetwork(MOCK_CHAIN_ID, BigNumber.from(1000)),
    ).to.be.rejectedWith('All wallets busy or out of funds.');
  });
}).timeout(10000);
