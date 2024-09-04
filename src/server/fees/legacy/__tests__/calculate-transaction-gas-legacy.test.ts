import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { assert } from 'console';
import configNetworks from '../../../config/config-networks';
import {
  getMockNetwork,
  mockTokenConfig,
  MOCK_TOKEN_6_DECIMALS,
  getMockContractTransaction,
} from '../../../../test/mocks.test';
import {
  createGasEstimateStubs,
  restoreGasEstimateStubs,
} from '../../../../test/stubs/ethers-provider-stubs.test';
import { initNetworkProviders } from '../../../providers/active-network-providers';
import {
  cacheTokenPriceForNetwork,
  resetTokenPriceCache,
  TokenPriceSource,
} from '../../../tokens/token-price-cache';
import { createTransactionGasDetailsLegacy } from '../calculate-transaction-gas-legacy';
import { getTokenFee } from '../../calculate-token-fee';
import {
  calculateMaximumGasBroadcaster,
  getEstimateGasDetailsPublic,
  getEstimateGasDetailsRelayed,
} from '../../gas-estimate';
import { initTokens } from '../../../tokens/network-tokens';
import { testChainEthereum } from '../../../../test/setup.test';
import {
  EVMGasType,
  getEVMGasTypeForTransaction,
  NETWORK_CONFIG,
  NetworkName,
  TransactionGasDetails,
} from '@railgun-community/shared-models';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = testChainEthereum();
const MOCK_WRAPPED_GAS_TOKEN =
  NETWORK_CONFIG[NetworkName.Ethereum].baseToken.wrappedAddress;
const MOCK_TOKEN_ADDRESS = '0x001';

// 0.10 estimate (est * price), 0.12 ETH total (gas limit).
const MOCK_GAS_ESTIMATE = 400000000000n;
const MOCK_MAX_FEE_PER_GAS = 240000n;
const MOCK_MAX_PRIORITY_FEE_PER_GAS = 10000n;
const mockGasDetails: TransactionGasDetails = {
  evmGasType: EVMGasType.Type2,
  gasEstimate: MOCK_GAS_ESTIMATE,
  maxFeePerGas: MOCK_MAX_FEE_PER_GAS,
  maxPriorityFeePerGas: MOCK_MAX_PRIORITY_FEE_PER_GAS,
};

describe('calculate-transaction-gas-legacy', () => {
  before(async () => {
    resetTokenPriceCache();
    mockTokenConfig(MOCK_CHAIN, MOCK_TOKEN_ADDRESS);
    mockTokenConfig(MOCK_CHAIN, MOCK_TOKEN_6_DECIMALS);
    await initTokens();
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockNetwork();
    configNetworks[MOCK_CHAIN.type][
      MOCK_CHAIN.id
    ].fees.gasEstimateVarianceBuffer = 0.05;
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id].fees.profit = 0.05;
    await initNetworkProviders([MOCK_CHAIN]);
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      MOCK_CHAIN,
      MOCK_WRAPPED_GAS_TOKEN,
      { price: 3250.0, updatedAt: Date.now() },
    );
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      MOCK_CHAIN,
      MOCK_TOKEN_ADDRESS,
      { price: 1.0, updatedAt: Date.now() },
    );
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      MOCK_CHAIN,
      MOCK_TOKEN_6_DECIMALS,
      { price: 1.0, updatedAt: Date.now() },
    );
  });

  afterEach(() => {
    restoreGasEstimateStubs();
  });

  after(() => {
    resetTokenPriceCache();
  });

  it('Should create gas details from token fee', () => {
    createGasEstimateStubs(
      MOCK_GAS_ESTIMATE,
      MOCK_MAX_FEE_PER_GAS,
      MOCK_MAX_PRIORITY_FEE_PER_GAS,
    );

    const tokenFee = 10n ** 18n * 429n; // $390 "USDC" (0.12 ETH) + 10% profit/buffer fee.
    const gasDetails = createTransactionGasDetailsLegacy(
      MOCK_CHAIN,
      mockGasDetails,
      MOCK_TOKEN_ADDRESS,
      tokenFee,
    );

    if (gasDetails.evmGasType !== EVMGasType.Type2) {
      assert(false, 'gas details must be type 2 for test');
      return;
    }

    expect(gasDetails.gasEstimate.toString()).to.equal('400000000000');
    expect(gasDetails.maxFeePerGas.toString()).to.equal('327380');
    expect(gasDetails.maxPriorityFeePerGas.toString()).to.equal('10000');
  });

  it('Should create gas details from token fee (6 decimals)', () => {
    createGasEstimateStubs(
      MOCK_GAS_ESTIMATE,
      MOCK_MAX_FEE_PER_GAS,
      MOCK_MAX_PRIORITY_FEE_PER_GAS,
    );

    const tokenFee = 10n ** 6n * 429n; // $390 "USDT" (0.12 ETH) + 10% profit/buffer fee.
    const gasDetails = createTransactionGasDetailsLegacy(
      MOCK_CHAIN,
      mockGasDetails,
      MOCK_TOKEN_6_DECIMALS,
      tokenFee,
    );

    if (gasDetails.evmGasType !== EVMGasType.Type2) {
      assert(false, 'gas details must be type 2 for test');
      return;
    }

    expect(gasDetails.gasEstimate.toString()).to.equal('400000000000');
    expect(gasDetails.maxFeePerGas.toString()).to.equal('327380');
    expect(gasDetails.maxPriorityFeePerGas.toString()).to.equal('10000');
  });

  it('[e2e] Should calculate token fee, then calculate equivalent gas fee (Public)', async () => {
    createGasEstimateStubs(
      MOCK_GAS_ESTIMATE,
      MOCK_MAX_FEE_PER_GAS,
      MOCK_MAX_PRIORITY_FEE_PER_GAS,
    );

    const populatedTransaction = getMockContractTransaction();

    const evmGasType = getEVMGasTypeForTransaction(NetworkName.Ethereum, false);

    const estimateGasDetails = await getEstimateGasDetailsPublic(
      MOCK_CHAIN,
      evmGasType,
      populatedTransaction,
    );
    const maximumGas = calculateMaximumGasBroadcaster(
      estimateGasDetails,
      MOCK_CHAIN,
    );
    const tokenFee = getTokenFee(MOCK_CHAIN, maximumGas, MOCK_TOKEN_ADDRESS);
    const gasDetails = createTransactionGasDetailsLegacy(
      MOCK_CHAIN,
      mockGasDetails,
      MOCK_TOKEN_ADDRESS,
      tokenFee,
    );

    if (gasDetails.evmGasType !== EVMGasType.Type2) {
      assert(false, 'gas details must be type 2 for test');
      return;
    }

    expect(gasDetails.gasEstimate.toString()).to.equal('400000000000');
    expect(gasDetails.maxFeePerGas.toString()).to.equal('240000');
    expect(gasDetails.maxPriorityFeePerGas.toString()).to.equal('10000');
  });

  it('[e2e] Should calculate token fee, then calculate equivalent gas fee (Relayed)', async () => {
    createGasEstimateStubs(
      MOCK_GAS_ESTIMATE,
      MOCK_MAX_FEE_PER_GAS,
      MOCK_MAX_PRIORITY_FEE_PER_GAS,
    );

    const populatedTransaction = getMockContractTransaction();

    const evmGasType = getEVMGasTypeForTransaction(NetworkName.Ethereum, false);

    const estimateGasDetails = await getEstimateGasDetailsRelayed(
      MOCK_CHAIN,
      evmGasType,
      MOCK_MAX_FEE_PER_GAS, // minGasPrice
      populatedTransaction,
    );
    const maximumGas = calculateMaximumGasBroadcaster(
      estimateGasDetails,
      MOCK_CHAIN,
    );
    const tokenFee = getTokenFee(MOCK_CHAIN, maximumGas, MOCK_TOKEN_ADDRESS);
    const gasDetails = createTransactionGasDetailsLegacy(
      MOCK_CHAIN,
      mockGasDetails,
      MOCK_TOKEN_ADDRESS,
      tokenFee,
    );

    if (gasDetails.evmGasType !== EVMGasType.Type2) {
      assert(false, 'gas details must be type 2 for test');
      return;
    }

    expect(gasDetails.gasEstimate.toString()).to.equal('400000000000');
    expect(gasDetails.maxFeePerGas.toString()).to.equal('240000');
    expect(gasDetails.maxPriorityFeePerGas.toString()).to.equal('10000');
  });
}).timeout(60000);
