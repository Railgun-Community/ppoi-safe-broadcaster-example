/* globals describe, before, it, beforeEach, afterEach */
import { FallbackProvider } from '@ethersproject/providers';
import { ERC20Note, Lepton } from '@railgun-community/lepton';
import { ERC20RailgunContract } from '@railgun-community/lepton/dist/contract';
import {
  ERC20Transaction,
  ERC20TransactionSerialized,
} from '@railgun-community/lepton/dist/transaction/erc20';
import {
  hexlify,
  padToLength,
} from '@railgun-community/lepton/dist/utils/bytes';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configDefaults from '../../config/config-defaults';
import configWallets from '../../config/config-wallets';
import {
  getMockRopstenNetwork,
  getMockToken,
  getMockWalletPubKey,
} from '../../../test/mocks.test';
import { getLepton, initLepton } from '../../lepton/lepton-init';
import {
  getProviderForNetwork,
  initNetworkProviders,
} from '../../providers/active-network-providers';
import {
  getActiveReceiverWalletPublicKey,
  getShieldedReceiverWallet,
  initWallets,
} from '../../wallets/active-wallets';
import { extractPackagedFeeFromTransaction } from '../extract-packaged-fee';
import {
  createLeptonVerifyProofStub,
  createLeptonWalletBalancesStub,
  restoreLeptonStubs,
} from '../../../test/stubs/lepton-stubs.test';

chai.use(chaiAsPromised);
const { expect } = chai;

let lepton: Lepton;
let railContractAddress: string;
let contract: ERC20RailgunContract;
let railgunWallet: RailgunWallet;
const RANDOM =
  '1e686e7506b0f4f21d6991b4cb58d39e77c31ed0577a986750c8dce8804af5b9';
const MOCK_TOKEN_ADDRESS = getMockToken().address;

const TREE = 0;
const ROPSTEN_CHAIN_ID = NetworkChainID.Ropsten;
const MOCK_MNEMONIC_1 =
  'hint profit virus forest angry puzzle index same feel behind grant repair';

const createRopstenTransaction = async (
  receiverWalletPublicKey: string,
  fee: BigNumber,
  tokenAddress: string,
): Promise<ERC20TransactionSerialized> => {
  const transaction = new ERC20Transaction(
    tokenAddress,
    ROPSTEN_CHAIN_ID,
    TREE,
  );
  transaction.outputs = [
    new ERC20Note(
      receiverWalletPublicKey,
      RANDOM,
      fee.toString(),
      tokenAddress,
    ),
  ];
  return transaction.prove(
    lepton.prover,
    railgunWallet,
    configDefaults.leptonDbEncryptionKey,
  );
};

describe('extract-packaged-fee', () => {
  before(async () => {
    initLepton();
    lepton = getLepton();

    configWallets.wallets = [
      {
        mnemonic: MOCK_MNEMONIC_1,
        priority: 1,
        isShieldedReceiver: true,
      },
    ];
    await initWallets();

    const ropstenNetwork = getMockRopstenNetwork();
    railContractAddress = ropstenNetwork.railContract;
    initNetworkProviders();
    const provider = getProviderForNetwork(ROPSTEN_CHAIN_ID);

    // Note: this call is typically async but we won't wait for the full call.
    // We just need to load the merkletrees.
    lepton.loadNetwork(
      ROPSTEN_CHAIN_ID,
      railContractAddress,
      provider as FallbackProvider,
      0, // deploymentBlock
    );
    contract = new ERC20RailgunContract(railContractAddress, provider);
    railgunWallet = getShieldedReceiverWallet();

    const tokenAddressHexlify = hexlify(padToLength(MOCK_TOKEN_ADDRESS, 32));
    createLeptonWalletBalancesStub(tokenAddressHexlify, TREE);
    createLeptonVerifyProofStub();
  });

  after(() => {
    restoreLeptonStubs();
  });

  it('Should extract fee correctly', async () => {
    const fee = BigNumber.from('1000');
    const receiverWalletPublicKey = getActiveReceiverWalletPublicKey();
    const transactions = await Promise.all([
      createRopstenTransaction(
        receiverWalletPublicKey,
        fee,
        MOCK_TOKEN_ADDRESS,
      ),
    ]);
    const populatedTransaction = await contract.transact(transactions);
    const packagedFee = extractPackagedFeeFromTransaction(
      ROPSTEN_CHAIN_ID,
      populatedTransaction,
    );
    const tokenAddressHexlify = hexlify(padToLength(MOCK_TOKEN_ADDRESS, 32));
    expect(packagedFee.tokenAddress).to.equal(tokenAddressHexlify);
    expect(packagedFee.packagedFeeAmount.toString()).to.equal('1000');
  }).timeout(60000);

  it('Should fail for incorrect pubkey', async () => {
    const fee = BigNumber.from('1000');
    const transactions = await Promise.all([
      createRopstenTransaction(getMockWalletPubKey(), fee, MOCK_TOKEN_ADDRESS),
    ]);
    const populatedTransaction = await contract.transact(transactions);
    expect(() =>
      extractPackagedFeeFromTransaction(ROPSTEN_CHAIN_ID, populatedTransaction),
    ).to.throw('No Relayer payment included in transaction.');
  }).timeout(60000);
}).timeout(120000);
