import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import axios from 'axios';
import * as zeroXFetchModule from '../0x-fetch';
import { getZeroXData, ZeroXApiEndpoint } from '../0x-fetch';
import configTokenPriceRefresher from '../../../config/config-token-price-refresher';
import {
  cacheTokenPriceForNetwork,
  cachedTokenPriceForSource,
  resetTokenPriceCache,
  TokenPriceSource,
  getTokenPriceCache,
} from '../../../tokens/token-price-cache';
import configNetworks from '../../../config/config-networks';
import {
  getMockNetwork,
  getMockRopstenNetwork,
  getMockTokenConfig,
} from '../../../../test/mocks.test';
import configTokens from '../../../config/config-tokens';
import { initTokens } from '../../../tokens/network-tokens';
import { initNetworkProviders } from '../../../providers/active-network-providers';
import {
  overrideZeroXPriceLookupDelay_TEST_ONLY,
  ZeroXPriceData,
  ZeroXPriceParams,
  zeroXUpdatePricesByAddresses,
} from '../0x-price';
import { RelayerChain } from '../../../../models/chain-models';
import {
  testChainEthereum,
  testChainRopsten,
} from '../../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const TOKEN_ADDRESS_1 = '0x013573';
const TOKEN_ADDRESS_2 = '0x73829';
const TOKEN_ADDRESSES = [TOKEN_ADDRESS_1, TOKEN_ADDRESS_2];

const ropstenNetwork = getMockRopstenNetwork();

const chainEthereum = testChainEthereum();
const chainRopsten = testChainRopsten();

const TOKEN_PRICE_SOURCE = TokenPriceSource.ZeroX;

const expectedZeroXPriceOutput: ZeroXPriceData = {
  price: '1234.56',
};

const validatePriceRefresherOutput = (chain: RelayerChain) => {
  TOKEN_ADDRESSES.forEach((address) => {
    const priceData = cachedTokenPriceForSource(
      TOKEN_PRICE_SOURCE,
      chain,
      address,
    );
    expect(priceData).to.be.an('object');
    expect(priceData?.price).to.be.a('number');
    expect(priceData?.updatedAt).to.be.greaterThan(Date.now() - 20);
  });
};

describe('0x-price', () => {
  before(async () => {
    configNetworks[chainEthereum.type][chainEthereum.id] = getMockNetwork();
    configNetworks[chainRopsten.type][chainRopsten.id] = ropstenNetwork;
    initNetworkProviders();

    resetTokenPriceCache();

    const tokenConfigs = {
      [TOKEN_ADDRESS_1]: getMockTokenConfig(),
      [TOKEN_ADDRESS_2]: getMockTokenConfig(),
    };

    overrideZeroXPriceLookupDelay_TEST_ONLY(5);

    // @ts-ignore
    configTokens[chainEthereum.type] ??= {};
    // @ts-ignore
    configTokens[chainRopsten.type] ??= {};
    configTokens[chainEthereum.type][chainEthereum.id] = tokenConfigs;
    configTokens[chainRopsten.type][chainRopsten.id] = tokenConfigs;
    await initTokens();
  });

  it('Should run live 0x API fetch for RAIL token', async () => {
    const params: ZeroXPriceParams = {
      sellToken: '0xe76c6c83af64e4c60245d8c7de953df673a7a33d', // RAIL
      buyToken: 'DAI',
      sellAmount: '1000000000000000000', // 1 token
    } as ZeroXPriceParams;
    const zeroXPriceData = await getZeroXData<ZeroXPriceData>(
      ZeroXApiEndpoint.PriceLookup,
      chainEthereum,
      params,
    );
    expect(zeroXPriceData).to.be.an('object');
    expect(zeroXPriceData.price).to.be.a('string');
    expect(parseFloat(zeroXPriceData.price)).to.be.a('number');
  }).timeout(20000);

  it('Should format prices from mock ZeroX response', async () => {
    const stubGetZeroXData = sinon
      .stub(zeroXFetchModule, 'getZeroXData')
      .resolves(expectedZeroXPriceOutput);

    await zeroXUpdatePricesByAddresses(
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
    validatePriceRefresherOutput(chainEthereum);

    stubGetZeroXData.restore();
  });

  it('Should not run price API request without tokens', async () => {
    const stubGetZeroXData = sinon
      .stub(zeroXFetchModule, 'getZeroXData')
      .resolves({});

    resetTokenPriceCache();

    const emptyList: string[] = [];
    await zeroXUpdatePricesByAddresses(
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
    expect(stubGetZeroXData.notCalled).to.be.true;

    stubGetZeroXData.restore();
  });

  it('Should not retry 0x API fetch on error', async () => {
    const stubAxiosGet = sinon.stub(axios, 'get').throws();

    const params = {
      contract_addresses: TOKEN_ADDRESSES.join(','),
      vs_currencies: 'usd',
      include_last_updated_at: true,
    };
    await expect(
      getZeroXData(ZeroXApiEndpoint.PriceLookup, chainEthereum, params),
    ).to.be.rejected;
    expect(stubAxiosGet.callCount).to.equal(1);

    stubAxiosGet.restore();
  });

  it('Should run 0x configured price refresher for Ethereum', async () => {
    const stubGetZeroXData = sinon
      .stub(zeroXFetchModule, 'getZeroXData')
      .resolves(expectedZeroXPriceOutput);

    await configTokenPriceRefresher.tokenPriceRefreshers[
      TOKEN_PRICE_SOURCE
    ].refresher(chainEthereum, TOKEN_ADDRESSES);
    validatePriceRefresherOutput(chainEthereum);

    stubGetZeroXData.restore();
  });

  it('Should run 0x configured price refresher for Ropsten', async () => {
    await configTokenPriceRefresher.tokenPriceRefreshers[
      TOKEN_PRICE_SOURCE
    ].refresher(chainRopsten, TOKEN_ADDRESSES);
    const ropstenPrices =
      getTokenPriceCache()[TOKEN_PRICE_SOURCE][chainRopsten.type][
        chainRopsten.id
      ];
    expect(ropstenPrices).to.equal(undefined);
  });
}).timeout(30000);
