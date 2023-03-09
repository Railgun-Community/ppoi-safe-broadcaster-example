import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber, Wallet as EthersWallet } from 'ethers';
import sinon, { SinonStub } from 'sinon';
import {
  getActiveWallets,
  getRailgunWalletID,
} from '../../wallets/active-wallets';
import { getMockGoerliNetwork, getMockToken } from '../../../test/mocks.test';
import {
  setupSingleTestWallet,
  testChainGoerli,
} from '../../../test/setup.test';
import { startEngine } from '../../engine/engine-init';
import { clearSettingsDB, initSettingsDB } from '../../db/settings-db';
import * as BestWalletMatchModule from '../../wallets/best-match-wallet';
import { ActiveWallet } from '../../../models/wallet-models';
import { initNetworkProviders } from '../../providers/active-network-providers';
import configNetworks from '../../config/config-networks';
import { restoreGasBalanceStub } from '../../../test/stubs/ethers-provider-stubs.test';
import { resetGasTokenBalanceCache } from '../../balances/balance-cache';
import { generateUnshieldTransaction } from '../unshield-tokens';
import configDefaults from '../../config/config-defaults';
import { getRailgunSmartWalletContractForNetwork } from '@railgun-community/quickstart';
import { networkForChain } from '@railgun-community/shared-models';

chai.use(chaiAsPromised);
const { expect } = chai;

let activeWallet: ActiveWallet;
let railgunWalletID: string;

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

const MOCK_CHAIN = testChainGoerli();

// const zeroProof = (): Proof => {
//   const zero = nToHex(BigInt(0), ByteLength.UINT_8);
//   return {
//     pi_a: [zero, zero],
//     pi_b: [
//       [zero, zero],
//       [zero, zero],
//     ],
//     pi_c: [zero, zero],
//   };
// };

describe('unshield-tokens', () => {
  before(async () => {
    startEngine();
    initSettingsDB();
    await clearSettingsDB();
    await setupSingleTestWallet();
    railgunWalletID = getRailgunWalletID();
    [activeWallet] = getActiveWallets();
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockGoerliNetwork();
    await initNetworkProviders();
    walletGetTransactionCountStub = sinon
      .stub(EthersWallet.prototype, 'getTransactionCount')
      .resolves(3);
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
    getBestMatchWalletForNetwork.restore();
    railProveStub?.restore();
  });

  it('Should fail with insufficient token balance', async () => {
    await expect(
      generateUnshieldTransaction(
        railgunWalletID,
        configDefaults.engine.dbEncryptionKey,
        activeWallet.address,
        [MOCK_TOKEN_AMOUNT_2],
        MOCK_CHAIN,
      ),
    ).to.be.rejectedWith('');
  });

  it.skip(
    'Should generate populated transaction to railgun contract ready for execute transaction',
    async () => {
      const populatedTransaction = await generateUnshieldTransaction(
        railgunWalletID,
        configDefaults.engine.dbEncryptionKey,
        activeWallet.address,
        [MOCK_TOKEN_AMOUNT_1],
        MOCK_CHAIN,
      );
      const network = networkForChain(MOCK_CHAIN);
      if (!network) {
        throw new Error('No network for chain');
      }
      const contractAddress = getRailgunSmartWalletContractForNetwork(
        network.name,
      ).address;

      expect(populatedTransaction.to?.toLowerCase()).to.equal(contractAddress);

      expect(populatedTransaction.from).to.be.undefined;
      expect(populatedTransaction.nonce).to.be.undefined;
    },
  ).timeout(30000);
});
