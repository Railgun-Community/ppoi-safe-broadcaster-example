/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../../config/config-chain-ids';
import {
  lookUpCachedTokenPrice,
  resetTokenPriceCache,
  TokenAddressesToPrice,
} from '../token-price-cache';
import { mockTokenDetails } from '../../../test/mocks.test';
import configDefaults from '../../../config/config-defaults';
import configTokenPriceGetter, {
  TokenPricesGetter,
} from '../../../config/config-token-price-getter';
import { initPricePoller } from '../token-price-poller';
import { delay } from '../../../util/promise-utils';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS_1 = 'a123';
const MOCK_TOKEN_PRICE_1 = 10.0;
const MOCK_TOKEN_ADDRESS_2 = 'b456';
const MOCK_TOKEN_PRICE_2 = 20.0;

const mockTokenPriceGetter: TokenPricesGetter = async (
  chainID: NetworkChainID,
  tokenAddresses: string[],
) => {
  const tokenAddressesToPrice: TokenAddressesToPrice = {};
  if (chainID === NetworkChainID.Ethereum) {
    for (const address of tokenAddresses) {
      switch (address) {
        case MOCK_TOKEN_ADDRESS_1:
          tokenAddressesToPrice[address] = {
            price: MOCK_TOKEN_PRICE_1,
            updatedAt: Date.now(),
          };
          break;
        case MOCK_TOKEN_ADDRESS_2:
          tokenAddressesToPrice[address] = {
            price: MOCK_TOKEN_PRICE_2,
            updatedAt: Date.now(),
          };
          break;
        default:
          break;
      }
    }
  }
  return tokenAddressesToPrice;
};

describe('token-price-poller', () => {
  before(() => {
    configTokenPriceGetter.tokenPriceGetter = mockTokenPriceGetter;
    configDefaults.tokenPriceRefreshDelayInMS = 3 * 1000; // 3 second refresh.
    mockTokenDetails(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_1);
    mockTokenDetails(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_2);
  });

  beforeEach(() => {
    resetTokenPriceCache();
  });

  it('Should pull prices immediately on init', async () => {
    initPricePoller();

    // Wait for async call to finish.
    await delay(10);

    expect(() =>
      lookUpCachedTokenPrice(NetworkChainID.Ropsten, MOCK_TOKEN_ADDRESS_1),
    ).to.throw(`No cached price for token: ${MOCK_TOKEN_ADDRESS_1}`);
    expect(
      lookUpCachedTokenPrice(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_1)
        .price,
    ).to.equal(MOCK_TOKEN_PRICE_1);
  });
}).timeout(20000);
