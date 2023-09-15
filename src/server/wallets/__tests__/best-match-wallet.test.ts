import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { HDNodeWallet, Mnemonic } from 'ethers';
import sinon, { SinonStub } from 'sinon';
import { startEngine } from '../../engine/engine-init';
import {
  createEthersWallet,
  derivationPathForIndex,
  getActiveWallets,
  initWallets,
} from '../active-wallets';
import { getBestMatchWalletForNetwork } from '../best-match-wallet';
import {
  resetAvailableWallets,
  setWalletAvailability,
} from '../available-wallets';
import { getMockNetwork, getMockProvider } from '../../../test/mocks.test';
import * as BalanceCacheModule from '../../balances/balance-cache';
import configDefaults from '../../config/config-defaults';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { testChainEthereum } from '../../../test/setup.test';
import { ErrorMessage } from '../../../util/errors';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = testChainEthereum();
const MOCK_MNEMONIC =
  'hint profit virus forest angry puzzle index same feel behind grant repair';

let getCachedGasTokenBalanceStub: SinonStub;

const addressForIndex = (index: number): string => {
  const ethersWallet = HDNodeWallet.fromMnemonic(
    Mnemonic.fromPhrase(MOCK_MNEMONIC),
    derivationPathForIndex(index),
  );
  return ethersWallet.address;
};

describe('best-match-wallet', () => {
  before(async () => {
    startEngine();
    getCachedGasTokenBalanceStub = sinon
      .stub(BalanceCacheModule, 'getCachedGasTokenBalance')
      .resolves(10n ** 18n);
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockNetwork();
    await initNetworkProviders([MOCK_CHAIN]);
  });

  afterEach(() => {
    resetAvailableWallets(MOCK_CHAIN);
  });

  after(() => {
    getCachedGasTokenBalanceStub.restore();
  });

  it('Should select best match wallet ordered by priority', async () => {
    configDefaults.wallet = {
      mnemonic: MOCK_MNEMONIC,
      randomizeWalletSelection: false,
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

    const bestWallet = await getBestMatchWalletForNetwork(MOCK_CHAIN, 100n);
    expect(bestWallet.address).to.equal(addressForIndex(2));
  });

  it('Should skip unavailable wallets when selecting best match', async () => {
    configDefaults.wallet = {
      mnemonic: MOCK_MNEMONIC,
      randomizeWalletSelection: false,
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
    setWalletAvailability(firstActiveWallet, MOCK_CHAIN, false);

    const bestWallet = await getBestMatchWalletForNetwork(MOCK_CHAIN, 100n);
    expect(bestWallet.address).to.equal(addressForIndex(2));
  });

  it('Should error if all wallets unavailable', async () => {
    configDefaults.wallet = {
      mnemonic: MOCK_MNEMONIC,
      randomizeWalletSelection: false,
      hdWallets: [
        {
          index: 0,
          priority: 1,
        },
      ],
    };
    await initWallets();

    const firstWallet = getActiveWallets()[0];
    setWalletAvailability(firstWallet, MOCK_CHAIN, false);

    await expect(
      getBestMatchWalletForNetwork(MOCK_CHAIN, 100n),
    ).to.be.rejectedWith(ErrorMessage.RELAYER_OUT_OF_GAS);
  }).timeout(10000);

  it('Should error if all wallets out of funds', async () => {
    configDefaults.wallet = {
      mnemonic: MOCK_MNEMONIC,
      randomizeWalletSelection: false,
      hdWallets: [
        {
          index: 0,
          priority: 1,
        },
      ],
    };
    await initWallets();

    await expect(
      getBestMatchWalletForNetwork(MOCK_CHAIN, 10n ** 19n),
    ).to.be.rejectedWith(ErrorMessage.RELAYER_OUT_OF_GAS);
  }).timeout(10000);
}).timeout(20000);
