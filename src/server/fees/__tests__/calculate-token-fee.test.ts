/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber, utils } from 'ethers';
import sinon, { SinonStub } from 'sinon';
import configTokens from '../../config/config-tokens';
import { Network } from '../../../models/network-models';
import { getMockSerializedTransaction } from '../../../test/mocks.test';
import { setupTestNetwork, testChainID } from '../../../test/setup.test';
import {
  cacheTokenPricesForNetwork,
  resetTokenPriceCache,
} from '../../tokens/token-price-cache';
import {
  calculateTokenFeeForTransaction,
  calculateTokenFeePerUnitGasToken,
} from '../calculate-token-fee';
import * as estimateMaximumGasModule from '../gas-estimate';

chai.use(chaiAsPromised);
const { expect } = chai;

let estimateMaximumGasStub: SinonStub;
let network: Network;
const chainID = testChainID();
const MOCK_TOKEN_ADDRESS = '0x12345';
const MOCK_TOKEN_ADDRESS_FEWER_DECIMALS = '0x46890';
const MOCK_SERIALIZED_TRANSACTION = getMockSerializedTransaction();

const stubEstimateMaximumGas = (maximumGas: BigNumber) => {
  estimateMaximumGasStub = sinon
    .stub(estimateMaximumGasModule, 'estimateMaximumGas')
    .resolves(maximumGas);
};

const setupMocks = (
  tokenAddress: string,
  tokenPrice: number,
  gasTokenPrice: number,
  maximumGas?: BigNumber,
) => {
  const gasTokenAddress = network.gasToken.wrappedAddress ?? '';
  const tokenPrices = {
    [tokenAddress]: {
      price: tokenPrice,
      updatedAt: Date.now(),
    },
    [gasTokenAddress]: {
      price: gasTokenPrice,
      updatedAt: Date.now(),
    },
  };
  cacheTokenPricesForNetwork(chainID, tokenPrices);
  if (maximumGas) {
    stubEstimateMaximumGas(maximumGas);
  }
};

describe('calculate-token-fee', () => {
  before(() => {
    network = setupTestNetwork();
    configTokens[chainID][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK',
      decimals: 18,
    };
    configTokens[chainID][MOCK_TOKEN_ADDRESS_FEWER_DECIMALS] = {
      symbol: 'MOCK',
      decimals: 6,
    };
  });

  afterEach(() => {
    resetTokenPriceCache();
    estimateMaximumGasStub?.restore();
  });

  it('Should calculate token fee per unit gas with precision', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    setupMocks(MOCK_TOKEN_ADDRESS, tokenPrice, gasTokenPrice);

    const maximumGasFeeForToken = calculateTokenFeePerUnitGasToken(
      chainID,
      MOCK_TOKEN_ADDRESS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal('1272742268040000000000');
  });

  it('Should calculate token fee per unit gas with different decimal amounts', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    setupMocks(MOCK_TOKEN_ADDRESS_FEWER_DECIMALS, tokenPrice, gasTokenPrice);

    const maximumGasFeeForToken = calculateTokenFeePerUnitGasToken(
      chainID,
      MOCK_TOKEN_ADDRESS_FEWER_DECIMALS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal('1272742268');
  });

  it('Should calculate token fee for transaction with precision', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    const maximumGas = utils.parseEther('0.01');
    setupMocks(MOCK_TOKEN_ADDRESS, tokenPrice, gasTokenPrice, maximumGas);

    const maximumGasFeeForToken = await calculateTokenFeeForTransaction(
      chainID,
      MOCK_SERIALIZED_TRANSACTION,
      MOCK_TOKEN_ADDRESS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal('12727422680400000000');
  });

  it('Should calculate token fee for transaction with different decimal amounts', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    const maximumGas = utils.parseEther('0.01');
    setupMocks(
      MOCK_TOKEN_ADDRESS_FEWER_DECIMALS,
      tokenPrice,
      gasTokenPrice,
      maximumGas,
    );

    const maximumGasFeeForToken = await calculateTokenFeeForTransaction(
      chainID,
      MOCK_SERIALIZED_TRANSACTION,
      MOCK_TOKEN_ADDRESS_FEWER_DECIMALS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal('12727422');
  });

  it('Should error when precision not high enough', async () => {
    const tokenPrice = 0.00000106;
    const gasTokenPrice = 1234.56;
    const maximumGas = utils.parseEther('0.01');
    setupMocks(MOCK_TOKEN_ADDRESS, tokenPrice, gasTokenPrice, maximumGas);

    const maximumGasFeeForTokenPromise = calculateTokenFeeForTransaction(
      chainID,
      MOCK_SERIALIZED_TRANSACTION,
      MOCK_TOKEN_ADDRESS,
    );

    await expect(maximumGasFeeForTokenPromise).to.be.rejected;
  });
}).timeout(10000);
