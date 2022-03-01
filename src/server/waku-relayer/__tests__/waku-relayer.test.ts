import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { JsonRpcRequest, JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { BigNumber } from 'ethers';
import { TransactionResponse } from '@ethersproject/providers';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import { WakuMethodNames, WakuRelayer, WAKU_TOPIC } from '../waku-relayer';
import {
  WakuApiClient,
  WakuRelayMessage,
  WakuRequestMethods,
} from '../../networking/waku-api-client';
import { WakuMethodParamsTransact } from '../methods/transact-method';
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
import * as processTransactionModule from '../../transactions/process-transaction';
import { WakuMessage } from '../waku-message';
import { contentTopics } from '../topics';
import { getMockSerializedTransaction } from '../../../test/mocks.test';
import { initTokens } from '../../tokens/network-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

let wakuRelayer: Optional<WakuRelayer>;

let clientHTTPStub: SinonStub;
let processTransactionStub: SinonStub;

let requestData: Optional<JsonRpcRequest>;

const MOCK_TOKEN_ADDRESS = '0x12345';
let network: Network;
const chainID = testChainID();

// eslint-disable-next-line require-await
const handleHTTPPost = async (url: string, data?: unknown) => {
  expect(url).to.equal('/');
  requestData = data as JsonRpcRequest;
  return { data: { result: {} } } as unknown as JsonRpcResult;
};

describe('waku-relayer', () => {
  before(async () => {
    configDefaults.transactionFees.feeExpirationInMS = 5 * 60 * 1000;
    initLepton();
    await setupSingleTestWallet();
    network = setupTestNetwork();
    configTokens[chainID][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK1',
    };
    await initTokens();
    processTransactionStub = sinon
      .stub(processTransactionModule, 'processTransaction')
      .resolves({ hash: '123' } as TransactionResponse);

    const client = new WakuApiClient({ url: '' });
    clientHTTPStub = sinon.stub(client.http, 'post').callsFake(handleHTTPPost);
    wakuRelayer = await WakuRelayer.init(client, {
      topic: WAKU_TOPIC,
    });
  });

  beforeEach(() => {
    requestData = undefined;
  });

  afterEach(() => {
    clientHTTPStub.resetBehavior();
    clientHTTPStub.resetHistory();
  });

  after(() => {
    clientHTTPStub.restore();
    processTransactionStub.restore();
    resetTokenPriceCache();
    resetTransactionFeeCache();
    wakuRelayer = undefined;
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

    const contentTopic = '/railgun/v1/1/fees/json';
    expect(contentTopic).to.equal(contentTopics.fees(chainID));

    await wakuRelayer?.broadcastFeesForChain(chainID);
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

  it('Should test transact method', async () => {
    const handleHTTPPost = () => {
      return { result: {} };
    };
    clientHTTPStub.callsFake(handleHTTPPost);

    const contentTopic = contentTopics.transact(chainID);

    const params: WakuMethodParamsTransact = {
      chainID,
      feesID: '468abc',
      serializedTransaction: getMockSerializedTransaction(),
      pubkey:
        '11fb161b4495579946dc95fecbc1a5f2673fb17b18d04d85459ea7ce0df10487',
    };
    const payload = {
      method: WakuMethodNames.Transact,
      params,
      id: 123456,
    };
    const relayMessage: WakuRelayMessage = {
      contentTopic,
      payload: Buffer.from(JSON.stringify(payload)),
      timestamp: Date.now(),
    };
    await wakuRelayer?.handleMessage(relayMessage);

    expect(clientHTTPStub.calledOnce).to.be.true;
    const postCall = clientHTTPStub.getCall(0);
    expect(postCall.args[0]).to.equal('/');
    const rpcArgs = postCall.args[1];
    expect(rpcArgs.id).to.be.a('number');
    expect(rpcArgs.method).to.equal(WakuRequestMethods.PublishMessage);
    expect(rpcArgs.params).to.be.an('array');
    expect(rpcArgs.params[0]).to.equal(WAKU_TOPIC);

    const expectedJsonRpcResult = formatJsonRpcResult(
      payload.id,
      JSON.stringify({
        type: 'txResponse.hash',
        hash: '123',
      }),
    );
    const expectedWakuMessage = WakuMessage.fromUtf8String(
      JSON.stringify(expectedJsonRpcResult),
      contentTopic,
      { timestamp: relayMessage.timestamp },
    );
    expect(expectedWakuMessage.payload).to.be.instanceof(Buffer);
    expect(rpcArgs.params[1].contentTopic).to.equal(relayMessage.contentTopic);
    expect(rpcArgs.params[1].payload).to.equal(
      Buffer.from(expectedWakuMessage.payload as Uint8Array).toString('hex'),
    );
    expect(rpcArgs.params[1].timestamp).to.be.greaterThanOrEqual(
      expectedWakuMessage.timestamp ?? 0,
    );
    expect(rpcArgs.params[1].timestamp).to.be.lessThan(
      (expectedWakuMessage.timestamp ?? 0) + 0.1,
    );
  });
}).timeout(10000);
