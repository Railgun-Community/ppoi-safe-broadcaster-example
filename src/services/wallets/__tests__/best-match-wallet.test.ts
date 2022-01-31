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
import { Wallet as EthersWallet } from 'ethers';
import { NetworkChainID } from '../../../config/config-chain-ids';
import {
  resetAvailableWallets,
  setWalletAvailable,
} from '../available-wallets';
import { getMockProvider } from '../../../test/mocks.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN_ID = NetworkChainID.Ethereum;
const MOCK_MNEMONIC_1 =
  'hint profit virus forest angry puzzle index same feel behind grant repair';
const MOCK_MNEMONIC_2 =
  'sense arena duck shine near cluster awful gravity act security cargo knock';
const MOCK_MNEMONIC_3 =
  'odor crucial flip innocent train smile jump pair agent cabbage gun never';

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
  });

  afterEach(() => {
    resetAvailableWallets();
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

    const bestWallet = getBestMatchWalletForNetwork(MOCK_CHAIN_ID);
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

    const bestWallet = getBestMatchWalletForNetwork(MOCK_CHAIN_ID);
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

    expect(() => getBestMatchWalletForNetwork(MOCK_CHAIN_ID)).to.throw(
      'No wallets available.',
    );
  });
}).timeout(10000);
