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
import { testChainEthereum } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS = '0x0013533';
let gasTokenAddress: string;

const MOCK_CHAIN = testChainEthereum();

const validatePackagedFee = (
  feeCacheID: string,
  packagedFee: BigNumber,
  maximumGas: BigNumber,
) => {
  return validateFee(
    MOCK_CHAIN,
    MOCK_TOKEN_ADDRESS,
    maximumGas,
    feeCacheID,
    packagedFee,
  );
};

describe('fee-validator', function test() {
  this.timeout(10000);

  before(async () => {
    const network = getMockNetwork();
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = network;
    gasTokenAddress = network.gasToken.wrappedAddress;
    await initNetworkProviders();
    configTokens[MOCK_CHAIN.type][MOCK_CHAIN.id] = {};
    configTokens[MOCK_CHAIN.type][MOCK_CHAIN.id][MOCK_TOKEN_ADDRESS] = {
      symbol: 'TOKEN',
    };
    await initTokens();
  });

  beforeEach(() => {
    resetTransactionFeeCache();
    resetTokenPriceCache();
  });

  it('Should validate if packaged fee > cached fee', () => {
    const feeCacheID = cacheUnitFeesForTokens(MOCK_CHAIN, {
      [MOCK_TOKEN_ADDRESS]: BigNumber.from(10),
    });
    expect(() =>
      validatePackagedFee(feeCacheID, BigNumber.from(100), BigNumber.from(10)),
    ).to.not.throw;
  });

  it('Should invalidate if packaged fee < cached fee', () => {
    const feeCacheID = cacheUnitFeesForTokens(MOCK_CHAIN, {
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
      MOCK_CHAIN,
      MOCK_TOKEN_ADDRESS,
      { price: 2, updatedAt: Date.now() },
    );
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      MOCK_CHAIN,
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
      MOCK_CHAIN,
      MOCK_TOKEN_ADDRESS,
      { price: 2, updatedAt: Date.now() },
    );
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      MOCK_CHAIN,
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
