import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../config/config-chain-ids';
import {
  cacheTokenPriceForNetwork,
  lookUpCachedTokenPrice,
  resetTokenPriceCache,
  TokenPriceSource,
} from '../token-price-cache';
import { mockTokenConfig } from '../../../test/mocks.test';
import configTokenPriceRefresher, {
  TokenPriceRefresher,
} from '../../config/config-token-price-refresher';
import { initPricePoller, stopPolling } from '../token-price-poller';
import { delay } from '../../../util/promise-utils';
import { initTokens } from '../network-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS_1 = 'a123';
const MOCK_TOKEN_PRICE_1 = 10.0;
const MOCK_TOKEN_ADDRESS_2 = 'b456';
const MOCK_TOKEN_PRICE_2 = 20.0;

const mockTokenPriceRefresherCoingecko = (
  refreshDelayInMS: number,
): TokenPriceRefresher => {
  const refresher = (chainID: NetworkChainID, tokenAddresses: string[]) => {
    if (chainID === NetworkChainID.Ethereum) {
      for (const address of tokenAddresses) {
        switch (address) {
          case MOCK_TOKEN_ADDRESS_1:
            cacheTokenPriceForNetwork(
              TokenPriceSource.CoinGecko,
              chainID,
              address,
              {
                price: MOCK_TOKEN_PRICE_1,
                updatedAt: Date.now(),
              },
            );
            break;
          case MOCK_TOKEN_ADDRESS_2:
            cacheTokenPriceForNetwork(
              TokenPriceSource.CoinGecko,
              chainID,
              address,
              {
                price: MOCK_TOKEN_PRICE_2,
                updatedAt: Date.now(),
              },
            );
            break;
          default:
            break;
        }
      }
    }
    return Promise.resolve();
  };

  return {
    refreshDelayInMS,
    refresher,
  };
};

describe('token-price-poller', () => {
  before(async () => {
    const refreshDelayInMS = 3000;
    configTokenPriceRefresher.tokenPriceRefreshers = {
      [TokenPriceSource.CoinGecko]:
        mockTokenPriceRefresherCoingecko(refreshDelayInMS),
    };
    mockTokenConfig(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_1);
    mockTokenConfig(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_2);
    await initTokens();
  });

  beforeEach(() => {
    resetTokenPriceCache();
  });

  it('Should pull prices immediately on init', async () => {
    initPricePoller();

    // Wait for async call to finish.
    await delay(10);
    stopPolling();

    expect(() =>
      lookUpCachedTokenPrice(NetworkChainID.Ropsten, MOCK_TOKEN_ADDRESS_1),
    ).to.throw(`No cached price for token: ${MOCK_TOKEN_ADDRESS_1}`);
    expect(
      lookUpCachedTokenPrice(NetworkChainID.Ethereum, MOCK_TOKEN_ADDRESS_1),
    ).to.equal(MOCK_TOKEN_PRICE_1);
  });
}).timeout(20000);
