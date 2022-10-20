import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configNetworks from '../../config/config-networks';
import {
  cacheTokenPriceForNetwork,
  lookUpCachedTokenPrice,
  resetTokenPriceCache,
  TokenPriceSource,
} from '../token-price-cache';
import { mockTokenConfig } from '../../../test/mocks.test';
import { initTokens } from '../network-tokens';
import { testChainEthereum, testChainGoerli } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS_1 = 'a123';
const MOCK_TOKEN_ADDRESS_2 = 'b456';

const MOCK_CHAIN_ETHEREUM = testChainEthereum();
const MOCK_CHAIN_ROPSTEN = testChainGoerli();

describe('token-price-cache', () => {
  before(async () => {
    mockTokenConfig(MOCK_CHAIN_ETHEREUM, MOCK_TOKEN_ADDRESS_1);
    mockTokenConfig(MOCK_CHAIN_ETHEREUM, MOCK_TOKEN_ADDRESS_2);
    mockTokenConfig(MOCK_CHAIN_ROPSTEN, MOCK_TOKEN_ADDRESS_1);
    await initTokens();
  });

  beforeEach(() => {
    resetTokenPriceCache();
  });

  it('Should error on empty map', () => {
    expect(() =>
      lookUpCachedTokenPrice(MOCK_CHAIN_ETHEREUM, MOCK_TOKEN_ADDRESS_1),
    ).to.throw(`No cached price for token: ${MOCK_TOKEN_ADDRESS_1}`);
  });

  it('Should pull price only for correct network and address', () => {
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      MOCK_CHAIN_ETHEREUM,
      MOCK_TOKEN_ADDRESS_1,
      {
        price: 10.0,
        updatedAt: Date.now(),
      },
    );
    expect(() =>
      lookUpCachedTokenPrice(MOCK_CHAIN_ETHEREUM, MOCK_TOKEN_ADDRESS_2),
    ).to.throw(`No cached price for token: ${MOCK_TOKEN_ADDRESS_2}`);
    expect(() =>
      lookUpCachedTokenPrice(MOCK_CHAIN_ROPSTEN, MOCK_TOKEN_ADDRESS_1),
    ).to.throw(`No cached price for token: ${MOCK_TOKEN_ADDRESS_1}`);
    expect(
      lookUpCachedTokenPrice(MOCK_CHAIN_ETHEREUM, MOCK_TOKEN_ADDRESS_1),
    ).to.equal(10.0);
  });

  it('Should correctly handle cache expiration', () => {
    configNetworks[MOCK_CHAIN_ETHEREUM.type][
      MOCK_CHAIN_ETHEREUM.id
    ].priceTTLInMS = 20 * 1000; // 20 second TTL.

    const expiredTime = Date.now() - 30 * 1000;
    const unexpiredTime = Date.now() - 10 * 1000;
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      MOCK_CHAIN_ETHEREUM,
      MOCK_TOKEN_ADDRESS_1,
      {
        price: 10.0,
        updatedAt: expiredTime,
      },
    );
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      MOCK_CHAIN_ETHEREUM,
      MOCK_TOKEN_ADDRESS_2,
      {
        price: 10.0,
        updatedAt: unexpiredTime,
      },
    );

    // Expired price should throw.
    expect(() =>
      lookUpCachedTokenPrice(MOCK_CHAIN_ETHEREUM, MOCK_TOKEN_ADDRESS_1),
    ).to.throw(`No cached price for token: ${MOCK_TOKEN_ADDRESS_1}`);

    // Unexpired price should pull.
    const cachedPrice = lookUpCachedTokenPrice(
      MOCK_CHAIN_ETHEREUM,
      MOCK_TOKEN_ADDRESS_2,
    );
    expect(cachedPrice).to.equal(10.0);
  });
}).timeout(10000);
