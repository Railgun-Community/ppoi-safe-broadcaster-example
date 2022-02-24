import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber, Wallet as EthersWallet } from 'ethers';
import sinon, { SinonStub } from 'sinon';
import { initLepton } from '../../lepton/lepton-init';
import {
  createEthersWallet,
  derivationPathForIndex,
  getActiveWallets,
  initWallets,
} from '../active-wallets';
import { getBestMatchWalletForNetwork } from '../best-match-wallet';
import { NetworkChainID } from '../../config/config-chain-ids';
import {
  resetAvailableWallets,
  setWalletAvailable,
} from '../available-wallets';
import { getMockNetwork, getMockProvider } from '../../../test/mocks.test';
import * as BalanceCacheModule from '../../balances/balance-cache';
import configDefaults from '../../config/config-defaults';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN_ID = NetworkChainID.Ethereum;
const MOCK_MNEMONIC =
  'hint profit virus forest angry puzzle index same feel behind grant repair';

let getCachedGasTokenBalanceStub: SinonStub;

const addressForIndex = (index: number): string => {
  const ethersWallet = EthersWallet.fromMnemonic(
    MOCK_MNEMONIC,
    derivationPathForIndex(index),
  );
  return ethersWallet.address;
};

describe('best-match-wallet', () => {
  before(() => {
    initLepton();
    getCachedGasTokenBalanceStub = sinon
      .stub(BalanceCacheModule, 'getCachedGasTokenBalance')
      .resolves(BigNumber.from(500));
    configNetworks[NetworkChainID.Ethereum] = getMockNetwork();
    initNetworkProviders();
  });

  afterEach(() => {
    resetAvailableWallets();
  });

  after(() => {
    getCachedGasTokenBalanceStub.restore();
  });

  it('Should select best match wallet ordered by priority', async () => {
    configDefaults.wallet = {
      mnemonic: MOCK_MNEMONIC,
      hdWallets: [
        {
          index: 0,
          priority: 3,
        },
        {
          index: 1,
          priority: 2,
        },
        {
          index: 2,
          priority: 1,
        },
      ],
    };
    await initWallets();

    const bestWallet = await getBestMatchWalletForNetwork(
      MOCK_CHAIN_ID,
      BigNumber.from(100),
    );
    expect(bestWallet.address).to.equal(addressForIndex(2));
  });

  it('Should skip unavailable wallets when selecting best match', async () => {
    configDefaults.wallet = {
      mnemonic: MOCK_MNEMONIC,
      hdWallets: [
        {
          index: 0,
          priority: 1,
        },
        {
          index: 1,
          priority: 2,
        },
        {
          index: 2,
          priority: 1,
        },
      ],
    };
    await initWallets();

    const firstActiveWallet = getActiveWallets()[0];
    const firstWallet = createEthersWallet(
      firstActiveWallet,
      getMockProvider(),
    );
    expect(firstWallet.address).to.equal(addressForIndex(0));
    setWalletAvailable(firstActiveWallet, false);

    const bestWallet = await getBestMatchWalletForNetwork(
      MOCK_CHAIN_ID,
      BigNumber.from(100),
    );
    expect(bestWallet.address).to.equal(addressForIndex(2));
  });

  it('Should error if all wallets unavailable', async () => {
    configDefaults.wallet = {
      mnemonic: MOCK_MNEMONIC,
      hdWallets: [
        {
          index: 0,
          priority: 1,
        },
      ],
    };
    await initWallets();

    const firstWallet = getActiveWallets()[0];
    setWalletAvailable(firstWallet, false);

    await expect(
      getBestMatchWalletForNetwork(MOCK_CHAIN_ID, BigNumber.from(100)),
    ).to.be.rejectedWith('All wallets busy or out of funds.');
  });

  it('Should error if all wallets out of funds', async () => {
    configDefaults.wallet = {
      mnemonic: MOCK_MNEMONIC,
      hdWallets: [
        {
          index: 0,
          priority: 1,
        },
      ],
    };
    await initWallets();

    await expect(
      getBestMatchWalletForNetwork(MOCK_CHAIN_ID, BigNumber.from(1000)),
    ).to.be.rejectedWith('All wallets busy or out of funds.');
  });
}).timeout(10000);
