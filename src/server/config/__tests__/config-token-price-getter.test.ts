import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getMockRopstenNetwork } from '../../../test/mocks.test';
import { NetworkChainID } from '../config-chain-ids';
import configNetworks from '../config-networks';
import configTokenPriceGetter from '../config-token-price-getter';
import configTokens from '../config-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

const testNetwork = getMockRopstenNetwork();
const MOCK_TOKEN_ADDRESS = '0x123';

describe('config-token-price-getter', () => {
  before(() => {
    configNetworks[NetworkChainID.Ropsten] = testNetwork;
    configTokens[NetworkChainID.Ropsten][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK',
      decimals: 18,
    };
  });

  it('Should get test network prices', async () => {
    const prices = await configTokenPriceGetter.tokenPriceGetter(
      NetworkChainID.Ropsten,
      [MOCK_TOKEN_ADDRESS],
    );
    expect(prices[MOCK_TOKEN_ADDRESS]?.price).to.equal(2000);
    expect(prices[testNetwork.gasToken.wrappedAddress]?.price).to.equal(2000);
  });
}).timeout(10000);
