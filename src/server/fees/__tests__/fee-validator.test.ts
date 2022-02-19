/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { BigNumber } from 'ethers';
import { validateFee } from '../fee-validator';
import * as estimateGasModule from '../gas-estimate';
import {
  cacheUnitFeesForTokens,
  resetTransactionFeeCache,
} from '../transaction-fee-cache';
import {
  getMockNetwork,
  getMockPopulatedTransaction,
} from '../../../test/mocks.test';
import {
  cacheTokenPricesForNetwork,
  resetTokenPriceCache,
  TokenPrice,
} from '../../tokens/token-price-cache';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import configTokens from '../../config/config-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TRANSACTION = getMockPopulatedTransaction();
const MOCK_TOKEN_ADDRESS = '0x0013533';
let gasTokenAddress: string;

let estimateMaximumGasStub: SinonStub;

const validatePackagedFee = (feeCacheID: string, packagedFee: BigNumber) => {
  return validateFee(
    CHAIN_ID,
    MOCK_TOKEN_ADDRESS,
    MOCK_TRANSACTION,
    feeCacheID,
    packagedFee,
  );
};

const stubEstimateMaximumGas = (fee: BigNumber) => {
  estimateMaximumGasStub = sinon
    .stub(estimateGasModule, 'estimateMaximumGas')
    .resolves(fee);
};

const stubEstimateMaximumGasError = () => {
  estimateMaximumGasStub = sinon
    .stub(estimateGasModule, 'estimateMaximumGas')
    .throws();
};

const CHAIN_ID = 1;

describe('fee-validator', () => {
  before(() => {
    const network = getMockNetwork();
    configNetworks[CHAIN_ID] = network;
    gasTokenAddress = network.gasToken.wrappedAddress;
    initNetworkProviders();
    configTokens[CHAIN_ID][MOCK_TOKEN_ADDRESS] = {
      symbol: 'TOKEN',
      decimals: 18,
    };
  });

  beforeEach(() => {
    resetTransactionFeeCache();
    resetTokenPriceCache();
  });

  afterEach(() => {
    estimateMaximumGasStub?.restore();
  });

  it('Should validate if packaged fee > cached fee', async () => {
    const feeCacheID = cacheUnitFeesForTokens(CHAIN_ID, {
      [MOCK_TOKEN_ADDRESS]: BigNumber.from(10),
    });
    stubEstimateMaximumGas(BigNumber.from(10));
    await expect(validatePackagedFee(feeCacheID, BigNumber.from(100))).to.be
      .fulfilled;
  });

  it('Should invalidate if packaged fee < cached fee', async () => {
    const feeCacheID = cacheUnitFeesForTokens(CHAIN_ID, {
      [MOCK_TOKEN_ADDRESS]: BigNumber.from(10),
    });
    stubEstimateMaximumGas(BigNumber.from(10));
    await expect(validatePackagedFee(feeCacheID, BigNumber.from(50))).to.be
      .rejected;
    expect(estimateMaximumGasStub.calledOnce).to.be.true;
  });

  it('Should invalidate without a cached or calculated fee', async () => {
    stubEstimateMaximumGas(BigNumber.from(10));
    await expect(validatePackagedFee('mockfeeid', BigNumber.from(15))).to.be
      .rejected;
    expect(estimateMaximumGasStub.calledOnce).to.be.true;
  });

  it('Should invalidate with gas error', async () => {
    stubEstimateMaximumGasError();
    await expect(validatePackagedFee('mockfeeid', BigNumber.from(15))).to.be
      .rejected;
    expect(estimateMaximumGasStub.calledOnce).to.be.true;
  });

  it('Should validate if packaged fee > calculated fee', async () => {
    stubEstimateMaximumGas(BigNumber.from(10));
    const tokenPrices: MapType<TokenPrice> = {
      [MOCK_TOKEN_ADDRESS]: { price: 2, updatedAt: Date.now() },
      [gasTokenAddress]: { price: 20, updatedAt: Date.now() },
    };
    cacheTokenPricesForNetwork(CHAIN_ID, tokenPrices);
    // 10 * 10 + 10%.
    await expect(validatePackagedFee('mockfeeid', BigNumber.from(110))).to.be
      .fulfilled;
    expect(estimateMaximumGasStub.calledOnce).to.be.true;
  });

  it('Should validate if packaged fee > calculated fee, with slippage', async () => {
    stubEstimateMaximumGas(BigNumber.from(10));
    const tokenPrices: MapType<TokenPrice> = {
      [MOCK_TOKEN_ADDRESS]: { price: 2, updatedAt: Date.now() },
      [gasTokenAddress]: { price: 20, updatedAt: Date.now() },
    };
    cacheTokenPricesForNetwork(CHAIN_ID, tokenPrices);
    // 10 * 10 + 10% - 5% slippage.
    await expect(validatePackagedFee('mockfeeid', BigNumber.from(105))).to.be
      .fulfilled;
    expect(estimateMaximumGasStub.calledOnce).to.be.true;
  });

  it('Should invalidate if packaged fee < calculated fee', async () => {
    stubEstimateMaximumGas(BigNumber.from(10));
    await expect(validatePackagedFee('mockfeeid', BigNumber.from(5))).to.be
      .rejected;
    expect(estimateMaximumGasStub.calledOnce).to.be.true;
  });
}).timeout(10000);
