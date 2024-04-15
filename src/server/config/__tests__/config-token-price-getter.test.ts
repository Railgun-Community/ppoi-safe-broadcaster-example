import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getMockGoerliNetwork, getMockNetwork } from '../../../test/mocks.test';
import { testChainEthereum, testChainGoerli } from '../../../test/setup.test';
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

const testNetwork = getMockNetwork();
const MOCK_CHAIN = testChainEthereum();
const MOCK_TOKEN_ADDRESS = testNetwork.gasToken.wrappedAddress;

describe('config-token-price-refresher', () => {
  before(async () => {
    await startEngine();
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
    expect(tokenAddressesToPrice[MOCK_TOKEN_ADDRESS]?.price).to.greaterThan(0);
    expect(
      tokenAddressesToPrice[testNetwork.gasToken.wrappedAddress]?.price,
    ).to.greaterThan(0);
    expect(tokenAddressesToPrice[MOCK_TOKEN_ADDRESS]?.price).to.be.a('number');
  });
}).timeout(31000);
