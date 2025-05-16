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
  // getMockGoerliNetwork,
  getMockTokenConfig,
} from '../../../../test/mocks.test';
import configTokens from '../../../config/config-tokens';
import { initTokens } from '../../../tokens/network-tokens';
import { initNetworkProviders } from '../../../providers/active-network-providers';
import {
  formatPriceResponse,
  overrideZeroXPriceLookupDelay_TEST_ONLY,
  ZeroXPriceData,
  ZeroXPriceParams,
  zeroXUpdatePricesByAddresses,
} from '../0x-price';
import { BroadcasterChain } from '../../../../models/chain-models';
import {
  testChainEthereum,
  // testChainGoerli,
} from '../../../../test/setup.test';
import { startEngine } from '../../../engine/engine-init';
import configDefaults from '../../../config/config-defaults';
import { testConfig } from '../../../../test/test-config.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const TOKEN_ADDRESS_1 = '0x013573';
const TOKEN_ADDRESS_2 = '0x73829';
const TOKEN_ADDRESSES = [TOKEN_ADDRESS_1, TOKEN_ADDRESS_2];

// const goerliNetwork = getMockGoerliNetwork();

const chainEthereum = testChainEthereum();
// const chainGoerli = testChainGoerli();

const TOKEN_PRICE_SOURCE = TokenPriceSource.ZeroX;

const expectedZeroXPriceOutput: ZeroXPriceData = {
  price: '1234.56',
  minBuyAmount: '1000000000000',
  sellAmount: '100000000000'
};

const validatePriceRefresherOutput = (chain: BroadcasterChain) => {
  TOKEN_ADDRESSES.forEach((address) => {
    const priceData = cachedTokenPriceForSource(
      TOKEN_PRICE_SOURCE,
      chain,
      address,
    );
    expect(priceData).to.be.an('object');
    expect(priceData?.price).to.be.a('number');
    expect(priceData?.updatedAt).to.be.greaterThanOrEqual(Date.now() - 100); // 100ms buffer
  });
};

describe('0x-price', () => {
  before(async () => {
    await startEngine();

    configDefaults.api.zeroXApiKey = testConfig.zeroXApiKey;

    configNetworks[chainEthereum.type][chainEthereum.id] = getMockNetwork();
    // configNetworks[chainGoerli.type][chainGoerli.id] = goerliNetwork;
    await initNetworkProviders([
      chainEthereum,
      // chainGoerli
    ]);

    resetTokenPriceCache();

    const tokenConfigs = {
      [TOKEN_ADDRESS_1]: getMockTokenConfig('DAI'),
      [TOKEN_ADDRESS_2]: getMockTokenConfig(),
    };

    overrideZeroXPriceLookupDelay_TEST_ONLY(5);

    // @ts-expect-error
    configTokens[chainEthereum.type] ??= {};
    configTokens[chainEthereum.type][chainEthereum.id] = tokenConfigs;

    // configTokens[chainGoerli.type] ??= {};
    // configTokens[chainGoerli.type][chainGoerli.id] = tokenConfigs;
    await initTokens();
  });

  it('Should run live 0x API fetch for RAIL token', async () => {
    const params: ZeroXPriceParams = {
      chainId: '1',
      sellToken: configNetworks[0][1].gasToken.wrappedAddress, // '0xe76c6c83af64e4c60245d8c7de953df673a7a33d', // RAIL
      buyToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      sellAmount: (1 * 10 ** 18).toString(), // '1000000000000000000', // 1 token
    } as ZeroXPriceParams;
    const zeroXPriceData = await getZeroXData<ZeroXPriceData>(
      ZeroXApiEndpoint.PriceLookup,
      chainEthereum,
      params,
    );
    const formattedPrice = formatPriceResponse(zeroXPriceData); //  BigInt(zeroXPriceData.minBuyAmount) / BigInt(zeroXPriceData.sellAmount)

    expect(zeroXPriceData).to.be.an('object');
    expect(zeroXPriceData.minBuyAmount).to.be.a('string');
    expect(zeroXPriceData.sellAmount).to.be.a('string');

    expect(formattedPrice).to.be.a('string');
  }).timeout(5000);

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

  // it('Should run 0x configured price refresher for Ropsten', async () => {
  //   await configTokenPriceRefresher.tokenPriceRefreshers[
  //     TOKEN_PRICE_SOURCE
  //   ].refresher(chainGoerli, TOKEN_ADDRESSES);
  //   const ropstenPrices =
  //     getTokenPriceCache()[TOKEN_PRICE_SOURCE][chainGoerli.type][
  //       chainGoerli.id
  //     ];
  //   expect(ropstenPrices).to.equal(undefined);
  // });
}).timeout(30000);
