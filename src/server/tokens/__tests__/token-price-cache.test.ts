/// <reference types="../../../global" />
/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import {
  cacheTokenPricesForNetwork,
  lookUpCachedTokenPrice,
  resetTokenPriceCache,
  TokenPrice,
} from '../token-price-cache';
import { mockTokenConfig } from '../../../test/mocks.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS_1 = 'a123';
const MOCK_TOKEN_ADDRESS_2 = 'b456';

describe('token-price-cache', () => {
  before(() => {
    mockTokenConfig(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_1);
    mockTokenConfig(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_2);
    mockTokenConfig(NetworkChainID.Ropsten, MOCK_TOKEN_ADDRESS_1);
  });

  beforeEach(() => {
    resetTokenPriceCache();
  });

  it('Should error on empty map', () => {
    expect(() =>
      lookUpCachedTokenPrice(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_1),
    ).to.throw(`No prices cached for network: ${NetworkChainID.Ethereum}`);
  });

  it('Should pull price only for correct network and address', () => {
    const tokenPrices: MapType<TokenPrice> = {
      [MOCK_TOKEN_ADDRESS_1]: { price: 10.0, updatedAt: Date.now() },
    };
    cacheTokenPricesForNetwork(NetworkChainID.Ethereum, tokenPrices);
    expect(() =>
      lookUpCachedTokenPrice(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_2),
    ).to.throw(`No cached price for token: ${MOCK_TOKEN_ADDRESS_2}`);
    expect(() =>
      lookUpCachedTokenPrice(NetworkChainID.Ropsten, MOCK_TOKEN_ADDRESS_1),
    ).to.throw(`No prices cached for network: ${NetworkChainID.Ropsten}`);
    expect(
      lookUpCachedTokenPrice(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_1)
        .price,
    ).to.equal(10.0);
  });

  it('Should correctly handle cache expiration', () => {
    configNetworks[NetworkChainID.Ethereum].priceTTLInMS = 20 * 1000; // 20 second TTL.

    const expiredTime = Date.now() - 30 * 1000;
    const unexpiredTime = Date.now() - 10 * 1000;
    const tokenPrices: MapType<TokenPrice> = {
      [MOCK_TOKEN_ADDRESS_1]: {
        price: 10.0,
        updatedAt: expiredTime,
      },
      [MOCK_TOKEN_ADDRESS_2]: {
        price: 10.0,
        updatedAt: unexpiredTime,
      },
    };
    cacheTokenPricesForNetwork(NetworkChainID.Ethereum, tokenPrices);

    // Expired price should throw.
    expect(() =>
      lookUpCachedTokenPrice(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_1),
    ).to.throw(`Price expired for token: ${MOCK_TOKEN_ADDRESS_1}`);

    // Unexpired price should pull.
    const cachedPrice = lookUpCachedTokenPrice(
      NetworkChainID.Ethereum,
      MOCK_TOKEN_ADDRESS_2,
    );
    expect(cachedPrice.price).to.equal(10.0);
    expect(cachedPrice.updatedAt).to.equal(unexpiredTime);
  });
}).timeout(10000);
