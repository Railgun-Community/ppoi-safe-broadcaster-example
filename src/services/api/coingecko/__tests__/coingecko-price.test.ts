/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { CoingeckoNetworkID } from '../../../../models/api-constants';
import { CoingeckoApiEndpoint, getCoingeckoData } from '../coingecko-fetch';
import { coingeckoPriceLookupByAddresses } from '../coingecko-price';
import * as coingeckoFetchModule from '../coingecko-fetch';
import axios from 'axios';

chai.use(chaiAsPromised);
const { expect } = chai;

const TOKEN_ADDRESSES = [
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  '0xe76c6c83af64e4c60245d8c7de953df673a7a33d', // RAIL
];

describe('coingecko-price', () => {
  it('Should run live Coingecko API fetch for Ethereum tokens', async () => {
    const params = {
      contract_addresses: TOKEN_ADDRESSES.join(','),
      vs_currencies: 'usd',
      include_last_updated_at: true,
    };
    const coingeckoPriceMap = await getCoingeckoData(
      CoingeckoApiEndpoint.PriceLookup,
      CoingeckoNetworkID.Ethereum,
      params,
    );
    TOKEN_ADDRESSES.forEach((address) => {
      const priceData = coingeckoPriceMap[address];
      expect(priceData).to.be.an('object');
      expect(priceData['usd']).to.be.a('number');
      expect(priceData.last_updated_at).to.be.a('number');
    });
  }).timeout(10000);

  it('Should format prices from mock Coingecko response', async () => {
    const nowTimestamp = Date.now();
    const stubInitPricePoller = sinon
      .stub(coingeckoFetchModule, 'getCoingeckoData')
      .resolves({
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
          usd: 1000.0,
          last_updated_at: nowTimestamp / 1000 - 30,
        },
        '0xe76c6c83af64e4c60245d8c7de953df673a7a33d': {
          usd: 3.0,
          last_updated_at: nowTimestamp / 1000 - 30,
        },
      });
    const tokenAddressesToPrice = await coingeckoPriceLookupByAddresses(
      CoingeckoNetworkID.Ethereum,
      TOKEN_ADDRESSES,
      'usd',
    );
    TOKEN_ADDRESSES.forEach((address) => {
      const priceData = tokenAddressesToPrice[address];
      expect(priceData).to.be.an('object');
      expect(priceData?.price).to.be.a('number');
      expect(priceData?.updatedAt).to.equal(nowTimestamp - 30000);
    });

    stubInitPricePoller.restore();
  });

  it('Should retry Coingecko API fetch on error', async () => {
    const stubAxiosGet = sinon.stub(axios, 'get').throws();
    const params = {
      contract_addresses: TOKEN_ADDRESSES.join(','),
      vs_currencies: 'usd',
      include_last_updated_at: true,
    };
    expect(
      getCoingeckoData(
        CoingeckoApiEndpoint.PriceLookup,
        CoingeckoNetworkID.Ethereum,
        params,
      ),
    ).to.be.rejected;
    expect(stubAxiosGet.calledTwice).to.be.true;
    stubAxiosGet.restore();
  });
}).timeout(30000);
