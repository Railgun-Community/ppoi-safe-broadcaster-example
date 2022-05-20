import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getMockRopstenNetwork } from '../../../test/mocks.test';
import { initTokens } from '../../tokens/network-tokens';
import {
  getTokenPriceCache,
  TokenPriceSource,
} from '../../tokens/token-price-cache';
import { NetworkChainID } from '../config-chain-ids';
import configNetworks from '../config-networks';
import configTokenPriceRefresher from '../config-token-price-refresher';
import configTokens from '../config-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

const testNetwork = getMockRopstenNetwork();
const MOCK_TOKEN_ADDRESS = '0x123';

describe('config-token-price-refresher', () => {
  before(async () => {
    configNetworks[NetworkChainID.Ropsten] = testNetwork;
    configTokens[NetworkChainID.Ropsten][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK',
    };
    await initTokens();
  });

  it('Should get test network prices', async () => {
    await configTokenPriceRefresher.tokenPriceRefreshers[
      TokenPriceSource.CoinGecko
    ].refresher(NetworkChainID.Ropsten, [MOCK_TOKEN_ADDRESS]);
    const tokenAddressesToPrice =
      getTokenPriceCache()[TokenPriceSource.CoinGecko][NetworkChainID.Ropsten];
    expect(tokenAddressesToPrice[MOCK_TOKEN_ADDRESS]?.price).to.equal(2000);
    expect(
      tokenAddressesToPrice[testNetwork.gasToken.wrappedAddress]?.price,
    ).to.equal(2000);
  });
}).timeout(10000);
