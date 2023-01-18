import { Provider } from '@ethersproject/providers';
import {
  AddressData,
  hexlify,
  TransactNote,
  OutputType,
  padToLength,
  RailgunEngine,
  RailgunSmartWalletContract,
  RailgunWallet,
  randomHex,
  RelayAdaptContract,
  TransactionStruct,
  TransactionBatch,
  getTokenDataERC20,
} from '@railgun-community/engine';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import configDefaults from '../../config/config-defaults';
import {
  getMockGoerliNetwork,
  getMockToken,
  mockViewingKeys,
} from '../../../test/mocks.test';
import { getRailgunEngine, initEngine } from '../../engine/engine-init';
import {
  getProviderForNetwork,
  initNetworkProviders,
} from '../../providers/active-network-providers';
import {
  getActiveWallets,
  getRailgunAddressData,
  getRailgunWallet,
  initWallets,
} from '../../wallets/active-wallets';
import { extractPackagedFeeFromTransaction } from '../extract-packaged-fee';
import {
  createEngineVerifyProofStub,
  createEngineWalletBalancesStub,
  restoreEngineStubs,
} from '../../../test/stubs/engine-stubs.test';
import { testChainHardhat, testChainGoerli } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

let engine: RailgunEngine;
let proxyContract: RailgunSmartWalletContract;
let relayAdaptContract: RelayAdaptContract;
let railgunWallet: RailgunWallet;
const RANDOM_TRANSACT = randomHex(16);
const RANDOM_RELAY_ADAPT = randomHex(31);
const MOCK_TOKEN_ADDRESS = getMockToken().address;

const TREE = 0;
const GOERLI_CHAIN = testChainGoerli();
const HARDHAT_CHAIN = testChainHardhat();
const MOCK_MNEMONIC_1 =
  'test test test test test test test test test test test junk';

const createGoerliTransferTransactions = async (
  receiverAddressData: AddressData,
  senderAddressData: AddressData,
  fee: BigNumber,
  tokenAddress: string,
): Promise<TransactionStruct[]> => {
  const transaction = new TransactionBatch(GOERLI_CHAIN);
  transaction.addOutput(
    TransactNote.createTransfer(
      receiverAddressData,
      senderAddressData,
      RANDOM_TRANSACT,
      BigInt(fee.toHexString()),
      getTokenDataERC20(tokenAddress),
      await mockViewingKeys(),
      false, // shouldShowSender
      OutputType.Transfer,
      undefined, // memoText
    ),
  );
  return transaction.generateDummyTransactions(
    engine.prover,
    railgunWallet,
    configDefaults.engine.dbEncryptionKey,
  );
};

const createGoerliRelayAdaptUnshieldTransactions = async (
  receiverAddressData: AddressData,
  senderAddressData: AddressData,
  fee: BigNumber,
  tokenAddress: string,
): Promise<TransactionStruct[]> => {
  const transaction = new TransactionBatch(GOERLI_CHAIN);
  transaction.addOutput(
    TransactNote.createTransfer(
      receiverAddressData,
      senderAddressData,
      RANDOM_TRANSACT,
      BigInt(fee.toHexString()),
      getTokenDataERC20(tokenAddress),
      await mockViewingKeys(),
      false, // shouldShowSender
      OutputType.Transfer,
      undefined, // memoText
    ),
  );
  return transaction.generateDummyTransactions(
    engine.prover,
    railgunWallet,
    configDefaults.engine.dbEncryptionKey,
  );
};

describe('extract-packaged-fee', () => {
  before(async () => {
    initEngine();
    engine = getRailgunEngine();

    configDefaults.wallet.mnemonic = MOCK_MNEMONIC_1;
    await initWallets();

    const goerliNetwork = getMockGoerliNetwork();
    const {
      proxyContract: ropstenProxyContractAddress,
      relayAdaptContract: ropstenRelayAdaptContractAddress,
    } = goerliNetwork;
    await initNetworkProviders([GOERLI_CHAIN, HARDHAT_CHAIN]);
    const provider = getProviderForNetwork(GOERLI_CHAIN);

    // Note: this call is typically async but we won't wait for the full call.
    // We just need to load the merkletrees.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    engine.loadNetwork(
      GOERLI_CHAIN,
      ropstenProxyContractAddress,
      ropstenRelayAdaptContractAddress,
      provider,
      0, // deploymentBlock
    );
    proxyContract = new RailgunSmartWalletContract(
      ropstenProxyContractAddress,
      provider as Provider,
      GOERLI_CHAIN,
    );
    relayAdaptContract = new RelayAdaptContract(
      ropstenRelayAdaptContractAddress,
      provider as Provider,
    );
    railgunWallet = getRailgunWallet();

    const tokenAddressHexlify = hexlify(padToLength(MOCK_TOKEN_ADDRESS, 32));
    await createEngineWalletBalancesStub(tokenAddressHexlify, TREE);
    createEngineVerifyProofStub();
  });

  after(() => {
    restoreEngineStubs();
  });

  it('Should extract fee correctly - transfer', async () => {
    const fee = BigNumber.from('1000');
    const receiverAddressData = getRailgunAddressData();
    const senderAddressData = RailgunEngine.decodeAddress(
      '0zk1qy00025qjn7vw0mvu4egcxlkjv3nkemeat92qdlh3lzl4rpzxv9f8rv7j6fe3z53ll2adx8kn0lj0ucjkz4xxyax8l9mpqjgrf9z3zjvlvqr4qxgznrpqugcjt8',
    );
    const transactions = await createGoerliTransferTransactions(
      receiverAddressData,
      senderAddressData,
      fee,
      MOCK_TOKEN_ADDRESS,
    );
    const populatedTransaction = await proxyContract.transact(transactions);
    const packagedFee = await extractPackagedFeeFromTransaction(
      GOERLI_CHAIN,
      populatedTransaction,
      false, // useRelayAdapt
    );
    expect(packagedFee.tokenAddress).to.equal(MOCK_TOKEN_ADDRESS.toLowerCase());
    expect(packagedFee.packagedFeeAmount.toString()).to.equal('1000');
  }).timeout(60000);

  it('Should fail for incorrect receiver address - transfer', async () => {
    const fee = BigNumber.from('1000');
    const receiverAddressData = RailgunEngine.decodeAddress(
      '0zk1q8hxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kfrv7j6fe3z53llhxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kg0zpzts',
    );
    const senderAddressData = RailgunEngine.decodeAddress(
      '0zk1qy00025qjn7vw0mvu4egcxlkjv3nkemeat92qdlh3lzl4rpzxv9f8rv7j6fe3z53ll2adx8kn0lj0ucjkz4xxyax8l9mpqjgrf9z3zjvlvqr4qxgznrpqugcjt8',
    );
    const transactions = await createGoerliTransferTransactions(
      receiverAddressData,
      senderAddressData,
      fee,
      MOCK_TOKEN_ADDRESS,
    );
    const populatedTransaction = await proxyContract.transact(transactions);
    await expect(
      extractPackagedFeeFromTransaction(
        GOERLI_CHAIN,
        populatedTransaction,
        false, // useRelayAdapt
      ),
    ).to.be.rejectedWith('No Relayer Fee included in transaction.');
  }).timeout(60000);

  it('Should extract fee correctly - relay adapt', async () => {
    const fee = BigNumber.from('1000');
    const receiverAddressData = getRailgunAddressData();
    const senderAddressData = RailgunEngine.decodeAddress(
      '0zk1qy00025qjn7vw0mvu4egcxlkjv3nkemeat92qdlh3lzl4rpzxv9f8rv7j6fe3z53ll2adx8kn0lj0ucjkz4xxyax8l9mpqjgrf9z3zjvlvqr4qxgznrpqugcjt8',
    );
    const transactions = await createGoerliRelayAdaptUnshieldTransactions(
      receiverAddressData,
      senderAddressData,
      fee,
      MOCK_TOKEN_ADDRESS,
    );
    const populatedTransaction =
      await relayAdaptContract.populateUnshieldBaseToken(
        transactions,
        getActiveWallets()[0].address,
        RANDOM_RELAY_ADAPT,
      );
    const packagedFee = await extractPackagedFeeFromTransaction(
      GOERLI_CHAIN,
      populatedTransaction,
      true, // useRelayAdapt
    );
    expect(packagedFee.tokenAddress).to.equal(MOCK_TOKEN_ADDRESS.toLowerCase());
    expect(packagedFee.packagedFeeAmount.toString()).to.equal('1000');
  }).timeout(60000);

  it('Should fail for incorrect receiver address - relay adapt', async () => {
    const fee = BigNumber.from('1000');
    const receiverAddressData = RailgunEngine.decodeAddress(
      '0zk1q8hxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kfrv7j6fe3z53llhxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kg0zpzts',
    );
    const senderAddressData = RailgunEngine.decodeAddress(
      '0zk1qy00025qjn7vw0mvu4egcxlkjv3nkemeat92qdlh3lzl4rpzxv9f8rv7j6fe3z53ll2adx8kn0lj0ucjkz4xxyax8l9mpqjgrf9z3zjvlvqr4qxgznrpqugcjt8',
    );
    const transactions = await createGoerliRelayAdaptUnshieldTransactions(
      receiverAddressData,
      senderAddressData,
      fee,
      MOCK_TOKEN_ADDRESS,
    );
    const populatedTransaction =
      await relayAdaptContract.populateUnshieldBaseToken(
        transactions,
        getActiveWallets()[0].address,
        RANDOM_RELAY_ADAPT,
      );
    await expect(
      extractPackagedFeeFromTransaction(
        GOERLI_CHAIN,
        populatedTransaction,
        true, // useRelayAdapt
      ),
    ).to.be.rejectedWith('No Relayer Fee included in transaction.');
  }).timeout(60000);
}).timeout(120000);
