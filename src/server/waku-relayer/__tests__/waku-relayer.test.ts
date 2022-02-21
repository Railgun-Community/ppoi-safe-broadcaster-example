/// <reference types="../../../global" />
/* globals describe, before, after, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types';
import { BigNumber } from 'ethers';
import { WakuRelayer, WakuRelayerOptions, WAKU_TOPIC } from '../waku-relayer';
import { WakuApiClient } from '../../networking/waku-api-client';
import {
  setupSingleTestWallet,
  setupTestNetwork,
  testChainID,
} from '../../../test/setup.test';
import { initLepton } from '../../lepton/lepton-init';
import configDefaults from '../../config/config-defaults';
import {
  cacheTokenPricesForNetwork,
  resetTokenPriceCache,
} from '../../tokens/token-price-cache';
import { resetTransactionFeeCache } from '../../fees/transaction-fee-cache';
import { Network } from '../../../models/network-models';
import configTokens from '../../config/config-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

let client: WakuApiClient;
let wakuRelayer: WakuRelayer;

let clientHTTPStub: SinonStub;

const MOCK_TOKEN_ADDRESS = '0x12345';
let network: Network;
const chainID = testChainID();

describe('waku-relayer', () => {
  before(async () => {
    initLepton(configDefaults.lepton.dbDir);
    await setupSingleTestWallet();
    network = setupTestNetwork();
    configTokens[chainID][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK1',
      decimals: 18,
    };
    const url = '';
    client = new WakuApiClient({
      url,
    });
    clientHTTPStub = sinon.stub(client.http, 'post');
    wakuRelayer = new WakuRelayer(client, {
      url,
      topic: WAKU_TOPIC,
    } as WakuRelayerOptions);
  });

  afterEach(() => {
    clientHTTPStub?.resetBehavior();
  });

  after(() => {
    clientHTTPStub?.restore();
    resetTokenPriceCache();
    resetTransactionFeeCache();
  });

  it('Should test fee broadcast', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    const tokenPrices = {
      [MOCK_TOKEN_ADDRESS]: {
        price: tokenPrice,
        updatedAt: Date.now(),
      },
      [network.gasToken.wrappedAddress]: {
        price: gasTokenPrice,
        updatedAt: Date.now(),
      },
    };
    cacheTokenPricesForNetwork(chainID, tokenPrices);

    let requestData: Optional<JsonRpcRequest>;
    const handleHTTPBroadcast = (url: string, data?: JsonRpcRequest) => {
      expect(url).to.equal('/');
      requestData = data;
      return { result: {} };
    };
    clientHTTPStub.callsFake(handleHTTPBroadcast);

    const contentTopic = '/railgun/v1/1/fees/json';
    expect(contentTopic).to.equal(`/railgun/v1/${chainID}/fees/json`);

    await wakuRelayer.broadcastFeesForChain(chainID);
    expect(requestData?.id).to.be.a('number');
    expect(requestData?.method).to.equal('post_waku_v2_relay_v1_message');
    expect(requestData?.params).to.be.an('array');
    expect(requestData?.params[0]).to.equal(WAKU_TOPIC);
    expect(requestData?.params[1]).to.be.an('object');
    const requestParams = requestData?.params[1];
    expect(requestParams?.contentTopic).to.equal(contentTopic);
    expect(requestParams?.timestamp).to.be.a('number');
    expect(requestParams?.payload).to.be.a('string');

    const utf8 = Buffer.from(requestParams.payload, 'hex').toString('utf8');
    const message = JSON.parse(utf8);
    expect(message.fees).to.be.an('object');
    expect(message.fees[MOCK_TOKEN_ADDRESS]).to.be.a(
      'string',
      'No fee for token in broadcast data',
    );
    expect(
      BigNumber.from(message.fees[MOCK_TOKEN_ADDRESS]).toString(),
    ).to.equal('1272742268040000000000');
    expect(message.feeExpiration).to.equal(300000);
    expect(message.pubkey).to.equal(
      '11fb161b4495579946dc95fecbc1a5f2673fb17b18d04d85459ea7ce0df10487',
    );
    expect(message.encryptedHash).to.equal('');
  });
}).timeout(10000);
