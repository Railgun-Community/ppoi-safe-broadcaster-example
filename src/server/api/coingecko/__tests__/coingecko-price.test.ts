import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import axios from 'axios';
import { CoingeckoNetworkID } from '../../../../models/api-constants';
import { CoingeckoApiEndpoint, getCoingeckoData } from '../coingecko-fetch';
import * as coingeckoFetchModule from '../coingecko-fetch';
import configTokenPriceRefresher from '../../../config/config-token-price-refresher';
import {
  cacheTokenPriceForNetwork,
  getTokenPriceCache,
  resetTokenPriceCache,
  TokenPriceSource,
} from '../../../tokens/token-price-cache';
import configNetworks from '../../../config/config-networks';
import {
  getMockNetwork,
  getMockGoerliNetwork,
  getMockTokenConfig,
} from '../../../../test/mocks.test';
import configTokens from '../../../config/config-tokens';
import { initTokens } from '../../../tokens/network-tokens';
import { initNetworkProviders } from '../../../providers/active-network-providers';
import { coingeckoUpdatePricesByAddresses } from '../coingecko-price';
import { BroadcasterChain } from '../../../../models/chain-models';
import {
  testChainEthereum,
  // testChainGoerli,
} from '../../../../test/setup.test';
import { startEngine } from '../../../engine/engine-init';

chai.use(chaiAsPromised);
const { expect } = chai;

const TOKEN_ADDRESS_1 = '0x013573';
const TOKEN_ADDRESS_2 = '0x73829';
const TOKEN_ADDRESSES = [TOKEN_ADDRESS_1, TOKEN_ADDRESS_2];

const goerliNetwork = getMockGoerliNetwork();
const chainEthereum = testChainEthereum();
// const chainGoerli = testChainGoerli();

const TOKEN_PRICE_SOURCE = TokenPriceSource.CoinGecko;

const expectedCoingeckoPriceOutput = (nowTimestamp: number) => {
  return {
    [TOKEN_ADDRESS_1]: {
      usd: 1000.0,
      last_updated_at: nowTimestamp / 1000 - 30,
    },
    [TOKEN_ADDRESS_2]: {
      usd: 3.0,
      last_updated_at: nowTimestamp / 1000 - 30,
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
    expect(priceData?.updatedAt).to.equal(nowTimestamp - 30000);
  });
};

describe('coingecko-price', () => {
  before(async () => {
    await startEngine();

    configNetworks[chainEthereum.type][chainEthereum.id] = getMockNetwork();
    // configNetworks[chainGoerli.type][chainGoerli.id] = goerliNetwork;
    await initNetworkProviders([
      chainEthereum,
      //  chainGoerli
    ]);

    resetTokenPriceCache();

    const tokenConfigs = {
      [TOKEN_ADDRESS_1]: getMockTokenConfig(),
      [TOKEN_ADDRESS_2]: getMockTokenConfig(),
    };

    // @ts-expect-error
    configTokens[chainEthereum.type] ??= {};
    configTokens[chainEthereum.type][chainEthereum.id] = tokenConfigs;
    // configTokens[chainGoerli.type] ??= {};
    // configTokens[chainGoerli.type][chainGoerli.id] = tokenConfigs;
    await initTokens();
  });

  it('Should run live Coingecko API fetch for Ethereum tokens', async () => {
    const liveTokenAddresses = [
      '0xe76c6c83af64e4c60245d8c7de953df673a7a33d', // RAIL
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    ];
    // Call them 1 by 1 to play nice with free-tier rate limit
    const coingeckoPriceMap: { [id: string]: any } = {};
    for (const address of liveTokenAddresses) {
      // eslint-disable-next-line no-await-in-loop
      const priceMap = await getCoingeckoData(
        CoingeckoApiEndpoint.PriceLookup,
        CoingeckoNetworkID.Ethereum,
        {
          contract_addresses: address,
          vs_currencies: 'usd',
          include_last_updated_at: true,
        },
      );
      Object.assign(coingeckoPriceMap, priceMap);
    }

    liveTokenAddresses.forEach((address) => {
      const priceData = coingeckoPriceMap[address];
      expect(priceData).to.be.an('object');
      expect(priceData.usd).to.be.a('number');
      expect(priceData.last_updated_at).to.be.a('number');
    });
  }).timeout(20000);

  it('Should format prices from mock Coingecko response', async () => {
    const nowTimestamp = Date.now();
    const stubGetCoingeckoData = sinon
      .stub(coingeckoFetchModule, 'getCoingeckoData')
      .resolves(expectedCoingeckoPriceOutput(nowTimestamp));

    await coingeckoUpdatePricesByAddresses(
      CoingeckoNetworkID.Ethereum,
      TOKEN_ADDRESSES,
      (tokenAddress, tokenPrice) =>
        cacheTokenPriceForNetwork(
          TOKEN_PRICE_SOURCE,
          chainEthereum,
          tokenAddress,
          tokenPrice,
        ),
    );
    validatePriceRefresherOutput(chainEthereum, nowTimestamp);

    stubGetCoingeckoData.restore();
  });

  it('Should not run price API request without tokens', async () => {
    const stubGetCoingeckoData = sinon
      .stub(coingeckoFetchModule, 'getCoingeckoData')
      .resolves({});

    resetTokenPriceCache();

    const emptyList: string[] = [];
    await coingeckoUpdatePricesByAddresses(
      CoingeckoNetworkID.Ethereum,
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
    expect(stubGetCoingeckoData.notCalled).to.be.true;

    stubGetCoingeckoData.restore();
  });

  it('Should retry Coingecko API fetch on error', async () => {
    const stubAxiosGet = sinon.stub(axios, 'get').throws();

    for (const address of TOKEN_ADDRESSES) {
      const params = {
        contract_addresses: address,
        vs_currencies: 'usd',
        include_last_updated_at: true,
      };
      // eslint-disable-next-line no-await-in-loop
      await expect(
        getCoingeckoData(
          CoingeckoApiEndpoint.PriceLookup,
          CoingeckoNetworkID.Ethereum,
          params,
        ),
      ).to.be.rejected;
    }
    expect(stubAxiosGet.callCount).to.equal(4);
    stubAxiosGet.restore();
  });

  it('Should run CoinGecko configured price refresher for Ethereum', async () => {
    const nowTimestamp = Date.now();
    const stubGetCoingeckoData = sinon
      .stub(coingeckoFetchModule, 'getCoingeckoData')
      .resolves(expectedCoingeckoPriceOutput(nowTimestamp));

    await configTokenPriceRefresher.tokenPriceRefreshers[
      TOKEN_PRICE_SOURCE
    ].refresher(chainEthereum, TOKEN_ADDRESSES);
    validatePriceRefresherOutput(chainEthereum, nowTimestamp);

    stubGetCoingeckoData.restore();
  });

  // it('Should run CoinGecko configured price refresher for Ropsten', async () => {
  //   await configTokenPriceRefresher.tokenPriceRefreshers[
  //     TOKEN_PRICE_SOURCE
  //   ].refresher(chainGoerli, TOKEN_ADDRESSES);
  //   const tokenAddressesToPrice =
  //     getTokenPriceCache()[TOKEN_PRICE_SOURCE][chainGoerli.type][
  //       chainGoerli.id
  //     ];
  //   expect(Object.keys(tokenAddressesToPrice).length).to.equal(3);
  //   expect(
  //     tokenAddressesToPrice[goerliNetwork.gasToken.wrappedAddress]?.price,
  //   ).to.equal(2000);
  // });
}).timeout(30000);
