import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { uniswapPriceLookupByAddress } from '../uniswap-price';
import { testChainEthereum } from '../../../../test/setup.test';
import { startEngine } from '../../../engine/engine-init';
import configNetworks from '../../../config/config-networks';
import { initTokens } from '../../../tokens/network-tokens';
import { getMockNetwork } from '../../../../test/mocks.test';
import configTokens from '../../../config/config-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase();
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase();

const chainEthereum = testChainEthereum();

describe('uniswap-price', () => {
  before(async () => {
    await startEngine();
    configNetworks[chainEthereum.type][chainEthereum.id] = getMockNetwork();
    const tokenConfigs = {
      [WETH_ADDRESS]: {
        symbol: 'WETH',
        decimals: 18,
      },
      [DAI_ADDRESS]: {
        symbol: 'DAI',
        decimals: 18,
      },
    };

    // @ts-expect-error
    configTokens[chainEthereum.type] ??= {};
    configTokens[chainEthereum.type][chainEthereum.id] = tokenConfigs;

    await initTokens();
  });

  it('should return the price of 1 for stablecoins', async () => {
    const tokenAddress = DAI_ADDRESS;

    const result = await uniswapPriceLookupByAddress(
      chainEthereum,
      tokenAddress,
    );
    expect(result).to.deep.equal({ price: 1 });
  });

  it('should return the price from the Uniswap quote response', async () => {
    const result = await uniswapPriceLookupByAddress(
      chainEthereum,
      WETH_ADDRESS,
    );
    expect(result).to.not.be.undefined;
    expect(result).to.have.property('price');
    expect(result?.price).to.be.a('number');
    expect(result?.price).to.be.greaterThan(0);
  });

  it('should return undefined if there is an error', async () => {
    const result = await uniswapPriceLookupByAddress(
      chainEthereum,
      '0x0000dead',
    );

    expect(result).to.be.undefined;
  });
});
