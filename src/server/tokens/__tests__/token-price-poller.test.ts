import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
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
import { initPricePoller, stopTokenPricePolling } from '../token-price-poller';
import { delay } from '../../../util/promise-utils';
import { initTokens } from '../network-tokens';
import { RelayerChain } from '../../../models/chain-models';
import { ChainType } from '@railgun-community/engine/dist/models/engine-types';
import { NetworkChainID } from '../../config/config-chains';
import { testChainEthereum, testChainRopsten } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS_1 = 'a123';
const MOCK_TOKEN_PRICE_1 = 10.0;
const MOCK_TOKEN_ADDRESS_2 = 'b456';
const MOCK_TOKEN_PRICE_2 = 20.0;

const mockTokenPriceRefresherCoingecko = (
  refreshDelayInMS: number,
): TokenPriceRefresher => {
  const refresher = (chain: RelayerChain, tokenAddresses: string[]) => {
    if (chain.type !== ChainType.EVM) {
      throw new Error('Only EVMs mock prices');
    }
    if (chain.id === NetworkChainID.Ethereum) {
      for (const address of tokenAddresses) {
        switch (address) {
          case MOCK_TOKEN_ADDRESS_1:
            cacheTokenPriceForNetwork(
              TokenPriceSource.CoinGecko,
              chain,
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
              chain,
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
    mockTokenConfig(testChainEthereum(), MOCK_TOKEN_ADDRESS_1);
    mockTokenConfig(testChainEthereum(), MOCK_TOKEN_ADDRESS_2);
    await initTokens();
  });

  beforeEach(() => {
    resetTokenPriceCache();
  });

  it('Should pull prices immediately on init', async () => {
    initPricePoller();

    // Wait for async call to finish.
    await delay(10);
    stopTokenPricePolling();

    expect(() =>
      lookUpCachedTokenPrice(testChainRopsten(), MOCK_TOKEN_ADDRESS_1),
    ).to.throw(`No cached price for token: ${MOCK_TOKEN_ADDRESS_1}`);
    expect(
      lookUpCachedTokenPrice(testChainEthereum(), MOCK_TOKEN_ADDRESS_1),
    ).to.equal(MOCK_TOKEN_PRICE_1);
  });
}).timeout(20000);
