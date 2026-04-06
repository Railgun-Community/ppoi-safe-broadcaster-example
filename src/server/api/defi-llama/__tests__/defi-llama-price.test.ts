import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import axios from 'axios';
import { BroadcasterChain } from '../../../../models/chain-models';
import {
  cacheTokenPriceForNetwork,
  getTokenPriceCache,
  resetTokenPriceCache,
  TokenPriceSource,
} from '../../../tokens/token-price-cache';
import configNetworks from '../../../config/config-networks';
import {
  getMockNetwork,
  getMockTokenConfig,
} from '../../../../test/mocks.test';
import configTokens from '../../../config/config-tokens';
import { initTokens } from '../../../tokens/network-tokens';
import { initNetworkProviders } from '../../../providers/active-network-providers';
import { defiLlamaUpdatePricesByAddresses } from '../defi-llama-price';
import { fetchDefiLlamaPrices } from '../defi-llama-fetch';
import { testChainEthereum } from '../../../../test/setup.test';
import { startEngine } from '../../../engine/engine-init';

chai.use(chaiAsPromised);
const { expect } = chai;

const TOKEN_ADDRESS_1 = '0x013573';
const TOKEN_ADDRESS_2 = '0x73829';
const TOKEN_ADDRESSES = [TOKEN_ADDRESS_1, TOKEN_ADDRESS_2];

const chainEthereum = testChainEthereum();

const TOKEN_PRICE_SOURCE = TokenPriceSource.DefiLlama;

const expectedDefiLlamaPriceOutput = (nowTimestamp: number) => {
  return {
    coins: {
      [`ethereum:${TOKEN_ADDRESS_1}`]: {
        price: 1000.0,
        symbol: 'TKN1',
        timestamp: nowTimestamp / 1000 - 30,
        confidence: 0.99,
      },
      [`ethereum:${TOKEN_ADDRESS_2}`]: {
        price: 3.0,
        symbol: 'TKN2',
        timestamp: nowTimestamp / 1000 - 30,
        confidence: 0.99,
      },
    },
  };
};

const validatePriceRefresherOutput = (
  chain: BroadcasterChain,
  nowTimestamp: number,
) => {
  const tokenAddressesToPrice =
    getTokenPriceCache()[TOKEN_PRICE_SOURCE][chain.type][chain.id];
  TOKEN_ADDRESSES.forEach((address) => {
    const priceData = tokenAddressesToPrice[address];
    expect(priceData).to.be.an('object');
    expect(priceData?.price).to.be.a('number');
    expect(priceData?.updatedAt).to.be.closeTo(nowTimestamp, 5000);
  });
};

describe('defi-llama-price', () => {
  before(async () => {
    await startEngine();

    configNetworks[chainEthereum.type][chainEthereum.id] = getMockNetwork();
    await initNetworkProviders([chainEthereum]);

    resetTokenPriceCache();

    const tokenConfigs = {
      [TOKEN_ADDRESS_1]: getMockTokenConfig(),
      [TOKEN_ADDRESS_2]: getMockTokenConfig(),
    };

    // @ts-expect-error
    configTokens[chainEthereum.type] ??= {};
    configTokens[chainEthereum.type][chainEthereum.id] = tokenConfigs;
    await initTokens();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('Should run live DefiLlama API fetch for Ethereum tokens', async () => {
    const liveTokenAddresses = [
      '0xe76c6c83af64e4c60245d8c7de953df673a7a33d', // RAIL
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    ];
    
    const prices = await fetchDefiLlamaPrices(chainEthereum, liveTokenAddresses);
    
    liveTokenAddresses.forEach((address) => {
      const key = `ethereum:${address}`;
      const priceData = prices.coins[key];
      expect(priceData).to.be.an('object');
      expect(priceData.price).to.be.a('number');
      expect(priceData.timestamp).to.be.a('number');
    });
  }).timeout(20000);

  it('Should format prices from mock DefiLlama response', async () => {
    const nowTimestamp = Date.now();
    const stubAxiosGet = sinon.stub(axios, 'get').resolves({
      data: expectedDefiLlamaPriceOutput(nowTimestamp),
    });

    await defiLlamaUpdatePricesByAddresses(
      chainEthereum,
      TOKEN_ADDRESSES,
      (tokenAddress, tokenPrice) =>
        cacheTokenPriceForNetwork(
          TOKEN_PRICE_SOURCE,
          chainEthereum,
          tokenAddress,
          tokenPrice,
        ),
    );
    expect(stubAxiosGet.called).to.be.true;
    validatePriceRefresherOutput(chainEthereum, nowTimestamp);
  });

  it('Should not run price API request without tokens', async () => {
    const stubAxiosGet = sinon.stub(axios, 'get').resolves({ data: { coins: {} } });

    resetTokenPriceCache();

    const emptyList: string[] = [];
    await defiLlamaUpdatePricesByAddresses(
      chainEthereum,
      emptyList,
      (tokenAddress, tokenPrice) =>
        cacheTokenPriceForNetwork(
          TOKEN_PRICE_SOURCE,
          chainEthereum,
          tokenAddress,
          tokenPrice,
        ),
    );
    const tokenPriceCache = getTokenPriceCache();
    expect(tokenPriceCache).to.deep.equal({});
    expect(stubAxiosGet.notCalled).to.be.true;
  });

  it('Should handle DefiLlama API error gracefully', async () => {
    const stubAxiosGet = sinon.stub(axios, 'get').rejects(new Error('API Error'));

    await defiLlamaUpdatePricesByAddresses(
      chainEthereum,
      TOKEN_ADDRESSES,
      (tokenAddress, tokenPrice) =>
        cacheTokenPriceForNetwork(
          TOKEN_PRICE_SOURCE,
          chainEthereum,
          tokenAddress,
          tokenPrice,
        ),
    );
    
    // Should not throw and cache should be empty/unchanged
    const tokenPriceCache = getTokenPriceCache();
    expect(tokenPriceCache[TOKEN_PRICE_SOURCE]).to.be.undefined;
    expect(stubAxiosGet.called).to.be.true;
  });
}).timeout(30000);
