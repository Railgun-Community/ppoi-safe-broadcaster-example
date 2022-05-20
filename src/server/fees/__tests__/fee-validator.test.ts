/// <reference types="../../../global" />
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import { validateFee } from '../fee-validator';
import {
  cacheUnitFeesForTokens,
  resetTransactionFeeCache,
} from '../transaction-fee-cache';
import { getMockNetwork } from '../../../test/mocks.test';
import {
  cacheTokenPriceForNetwork,
  resetTokenPriceCache,
  TokenPriceSource,
} from '../../tokens/token-price-cache';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import configTokens from '../../config/config-tokens';
import { initTokens } from '../../tokens/network-tokens';
import { ErrorMessage } from '../../../util/errors';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS = '0x0013533';
let gasTokenAddress: string;

const validatePackagedFee = (
  feeCacheID: string,
  packagedFee: BigNumber,
  maximumGas: BigNumber,
) => {
  return validateFee(
    CHAIN_ID,
    MOCK_TOKEN_ADDRESS,
    maximumGas,
    feeCacheID,
    packagedFee,
  );
};

const CHAIN_ID = 1;

describe('fee-validator', () => {
  before(async () => {
    const network = getMockNetwork();
    configNetworks[CHAIN_ID] = network;
    gasTokenAddress = network.gasToken.wrappedAddress;
    initNetworkProviders();
    configTokens[CHAIN_ID] = {};
    configTokens[CHAIN_ID][MOCK_TOKEN_ADDRESS] = {
      symbol: 'TOKEN',
    };
    await initTokens();
  });

  beforeEach(() => {
    resetTransactionFeeCache();
    resetTokenPriceCache();
  });

  it('Should validate if packaged fee > cached fee', () => {
    const feeCacheID = cacheUnitFeesForTokens(CHAIN_ID, {
      [MOCK_TOKEN_ADDRESS]: BigNumber.from(10),
    });
    expect(() =>
      validatePackagedFee(feeCacheID, BigNumber.from(100), BigNumber.from(10)),
    ).to.not.throw;
  });

  it('Should invalidate if packaged fee < cached fee', () => {
    const feeCacheID = cacheUnitFeesForTokens(CHAIN_ID, {
      [MOCK_TOKEN_ADDRESS]: BigNumber.from(10),
    });
    expect(() =>
      validatePackagedFee(feeCacheID, BigNumber.from(50), BigNumber.from(10)),
    ).to.throw(ErrorMessage.BAD_TOKEN_FEE);
  });

  it('Should invalidate without a cached or calculated fee', () => {
    expect(() =>
      validatePackagedFee('mockfeeid', BigNumber.from(15), BigNumber.from(10)),
    ).to.throw(ErrorMessage.BAD_TOKEN_FEE);
  });

  it('Should validate if packaged fee > calculated fee', () => {
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      CHAIN_ID,
      MOCK_TOKEN_ADDRESS,
      { price: 2, updatedAt: Date.now() },
    );
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      CHAIN_ID,
      gasTokenAddress,
      { price: 20, updatedAt: Date.now() },
    );
    // 10 * 10 + 10%.
    expect(() =>
      validatePackagedFee('mockfeeid', BigNumber.from(110), BigNumber.from(10)),
    ).to.not.throw;
  });

  it('Should validate if packaged fee > calculated fee, with slippage', () => {
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      CHAIN_ID,
      MOCK_TOKEN_ADDRESS,
      { price: 2, updatedAt: Date.now() },
    );
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      CHAIN_ID,
      gasTokenAddress,
      { price: 20, updatedAt: Date.now() },
    );
    // 10 * 10 + 10% - 5% slippage.
    expect(() =>
      validatePackagedFee('mockfeeid', BigNumber.from(105), BigNumber.from(10)),
    ).to.not.throw;
  });

  it('Should invalidate if packaged fee < calculated fee', () => {
    expect(() =>
      validatePackagedFee('mockfeeid', BigNumber.from(5), BigNumber.from(10)),
    ).to.throw(ErrorMessage.BAD_TOKEN_FEE);
  });
}).timeout(10000);
