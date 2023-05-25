import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getMockGoerliNetwork } from '../../../test/mocks.test';
import { testChainGoerli } from '../../../test/setup.test';
import { startEngine } from '../../engine/engine-init';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { initTokens } from '../../tokens/network-tokens';
import {
  getTokenPriceCache,
  TokenPriceSource,
} from '../../tokens/token-price-cache';
import configNetworks from '../config-networks';
import configTokenPriceRefresher from '../config-token-price-refresher';
import configTokens from '../config-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

const testNetwork = getMockGoerliNetwork();
const MOCK_TOKEN_ADDRESS = '0x123';
const MOCK_CHAIN = testChainGoerli();

describe('config-token-price-refresher', () => {
  before(async () => {
    startEngine();
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = testNetwork;
    await initNetworkProviders([MOCK_CHAIN]);
    // @ts-expect-error
    configTokens[MOCK_CHAIN.type] ??= {};
    configTokens[MOCK_CHAIN.type][MOCK_CHAIN.id] ??= {};
    configTokens[MOCK_CHAIN.type][MOCK_CHAIN.id][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK',
    };
    await initTokens();
  });

  it('Should get test network prices', async () => {
    await configTokenPriceRefresher.tokenPriceRefreshers[
      TokenPriceSource.CoinGecko
    ].refresher(MOCK_CHAIN, [MOCK_TOKEN_ADDRESS]);
    const tokenAddressesToPrice =
      getTokenPriceCache()[TokenPriceSource.CoinGecko][MOCK_CHAIN.type][
        MOCK_CHAIN.id
      ];
    expect(tokenAddressesToPrice[MOCK_TOKEN_ADDRESS]?.price).to.equal(2000);
    expect(
      tokenAddressesToPrice[testNetwork.gasToken.wrappedAddress]?.price,
    ).to.equal(2000);
  });
}).timeout(10000);
