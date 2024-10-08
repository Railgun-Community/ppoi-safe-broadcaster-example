import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { testChainEthereum } from '../../../test/setup.test';
import configTokens from '../../config/config-tokens';
import { allTokenAddressesForNetwork, initTokens } from '../network-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = testChainEthereum();

describe('network-tokens', () => {
  before(async () => {
    // @ts-expect-error
    configTokens[MOCK_CHAIN.type] ??= {};
    configTokens[MOCK_CHAIN.type][MOCK_CHAIN.id] = {
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
        symbol: 'WETH',
      },
    };
    await initTokens(MOCK_CHAIN);
  });

  it('Should have correct number of tokens', () => {
    const tokenAddresses = allTokenAddressesForNetwork(MOCK_CHAIN);
    expect(tokenAddresses.length).to.equal(1);
  });

  it('Should return WETH token address', () => {
    const tokenAddresses = allTokenAddressesForNetwork(MOCK_CHAIN);
    expect(tokenAddresses).to.contain(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );
  });
}).timeout(120000);
