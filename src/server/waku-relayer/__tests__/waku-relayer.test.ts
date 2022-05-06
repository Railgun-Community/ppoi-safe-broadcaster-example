import * as ed from '@noble/ed25519';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { JsonRpcRequest, JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { BigNumber } from 'ethers';
import { TransactionResponse } from '@ethersproject/providers';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import { bytes } from '@railgun-community/lepton/dist/utils';
import { verifyED25519 } from '@railgun-community/lepton/dist/utils/keys-utils';
import { decode } from '@railgun-community/lepton/dist/keyderivation/bech32-encode';
import {
  hexlify,
  hexStringToBytes,
} from '@railgun-community/lepton/dist/utils/bytes';
import { tryDecryptJSONDataWithSharedKey } from '@railgun-community/lepton/dist/utils/ecies';
import assert from 'assert';
import {
  FeeMessage,
  FeeMessageData,
  WakuMethodNames,
  WakuRelayer,
  WAKU_TOPIC,
} from '../waku-relayer';
import {
  WakuApiClient,
  WakuRelayMessage,
  WakuRequestMethods,
} from '../../networking/waku-api-client';
import {
  encryptResponseData,
  RawParamsTransact,
  tryDecryptData,
  WakuMethodParamsTransact,
} from '../methods/transact-method';
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
import {
  getMockNetwork,
  getMockSerializedTransaction,
} from '../../../test/mocks.test';
import { initTokens } from '../../tokens/network-tokens';
import {
  getRailgunAddressData,
  getRailgunPrivateViewingKey,
  getRailgunWallet,
} from '../../wallets/active-wallets';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import {
  createGasBalanceStub,
  restoreGasBalanceStub,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { resetGasTokenBalanceCache } from '../../balances/balance-cache';

chai.use(chaiAsPromised);
const { expect } = chai;

let wakuRelayer: WakuRelayer;
let client: WakuApiClient;

let clientHTTPStub: SinonStub;
let processTransactionStub: SinonStub;

// @ts-ignore
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
    configNetworks[chainID] = getMockNetwork();
    initNetworkProviders();
    configTokens[chainID] = {};
    configTokens[chainID][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK1',
    };
    await initTokens();
    processTransactionStub = sinon
      .stub(processTransactionModule, 'processTransaction')
      .resolves({ hash: '123' } as TransactionResponse);

    client = new WakuApiClient({ url: '' });
    clientHTTPStub = sinon.stub(client.http, 'post').callsFake(handleHTTPPost);
    const wallet = getRailgunWallet();
    wakuRelayer = await WakuRelayer.init(client, wallet, {
      topic: WAKU_TOPIC,
      feeExpiration: configDefaults.transactionFees.feeExpirationInMS,
    });
    clientHTTPStub.resetHistory();
    createGasBalanceStub(BigNumber.from(10).pow(18));
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
    resetGasTokenBalanceCache();
    restoreGasBalanceStub();
  });

  it('Should re-subscribe when unsubscribed', async () => {
    const handleHTTPPost = () => {
      return {
        error: {
          code: -32000,
          message: 'get_waku_v2_relay_v1_messsages raised an exception',
          data: 'not subscribed to topic: /waku/2/default-waku/proto',
        },
      };
    };
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
    expect(requestData?.method).to.equal(WakuRequestMethods.PublishMessage);
    expect(requestData?.params).to.be.an('array');
    expect(requestData?.params[0]).to.equal(WAKU_TOPIC);
    expect(requestData?.params[1]).to.be.an('object');
    const requestParams = requestData?.params[1];
    expect(requestParams?.contentTopic).to.equal(contentTopic);
    expect(requestParams?.timestamp).to.be.a('number');
    expect(requestParams?.payload).to.be.a('string');

    const utf8 = Buffer.from(requestParams.payload, 'hex').toString('utf8');
    const message = JSON.parse(utf8) as FeeMessage;
    const data = JSON.parse(bytes.toUTF8String(message.data)) as FeeMessageData;
    const { signature } = message;
    expect(data).to.be.an('object');
    expect(data.fees[MOCK_TOKEN_ADDRESS]).to.be.a(
      'string',
      'No fee for token in broadcast data',
    );
    expect(BigNumber.from(data.fees[MOCK_TOKEN_ADDRESS]).toString()).to.equal(
      '1272742268040000000000',
    );
    expect(data.feeExpiration).to.be.a('number');
    expect(data.railAddress).to.equal(
      '0zk1qyk9nn28x0u3rwn5pknglda68wrn7gw6anjw8gg94mcj6eq5u48tlrv7j6fe3z53lama02nutwtcqc979wnce0qwly4y7w4rls5cq040g7z8eagshxrw5ajy990',
    );
    const decodedRailAddress = decode(data.railAddress);
    const isValid = await verifyED25519(
      hexStringToBytes(message.data),
      hexStringToBytes(signature),
      decodedRailAddress.viewingPublicKey,
    );
    expect(isValid).to.be.true;
  }).timeout(5000);

  it('Should encrypt and decrypt data using shared keys', async () => {
    const relayerPrivateKey = getRailgunPrivateViewingKey();
    const relayerPublicKey = await ed.getPublicKey(relayerPrivateKey);
    const { viewingPublicKey } = getRailgunAddressData();

    const data: RawParamsTransact = {
      chainID,
      feesID: '468abc',
      serializedTransaction: getMockSerializedTransaction(),
      relayerViewingKey: hexlify(viewingPublicKey),
    };
    const randomPrivKey = bytes.random(32);
    const randomPubKeyUint8Array = await ed.getPublicKey(randomPrivKey);
    const sharedKey = await ed.getSharedSecret(randomPrivKey, relayerPublicKey);
    const encryptedData = encryptResponseData(data, sharedKey);

    const sharedKeyAlternate = await ed.getSharedSecret(
      relayerPrivateKey,
      randomPubKeyUint8Array,
    );
    expect(sharedKeyAlternate).to.deep.equal(sharedKey);

    expect(await tryDecryptData(encryptedData, sharedKey)).to.deep.equal(data);
  });

  it('Should test transact method', async () => {
    const handleHTTPPost = () => {
      return { result: {} };
    };
    clientHTTPStub.callsFake(handleHTTPPost);

    const contentTopic = contentTopics.transact(chainID);

    const relayerPrivateKey = getRailgunPrivateViewingKey();
    const relayerPublicKey = await ed.getPublicKey(relayerPrivateKey);
    const { viewingPublicKey } = getRailgunAddressData();

    const data: RawParamsTransact = {
      chainID,
      feesID: '468abc',
      serializedTransaction: getMockSerializedTransaction(),
      relayerViewingKey: hexlify(viewingPublicKey),
    };
    const randomPrivKey = bytes.random(32);
    const randomPubKeyUint8Array = await ed.getPublicKey(randomPrivKey);
    const clientPubKey = hexlify(randomPubKeyUint8Array);
    const sharedKey = await ed.getSharedSecret(randomPrivKey, relayerPublicKey);
    const encryptedData = encryptResponseData(data, sharedKey);
    const params: WakuMethodParamsTransact = {
      encryptedData,
      pubkey: clientPubKey,
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

    // After transact-response sent.
    expect(clientHTTPStub.calledOnce).to.be.true;
    const postCall = clientHTTPStub.getCall(0);
    expect(postCall.args[0]).to.equal('/');
    const rpcArgs = postCall.args[1];
    expect(rpcArgs.id).to.be.a('number');
    expect(rpcArgs.method).to.equal(WakuRequestMethods.PublishMessage);
    expect(rpcArgs.params).to.be.an('array');
    expect(rpcArgs.params[0]).to.equal(WAKU_TOPIC);

    const encryptedResponse = encryptResponseData(
      {
        txHash: '123',
      },
      sharedKey,
    );
    const expectedJsonRpcResult = formatJsonRpcResult(
      payload.id,
      encryptedResponse,
    );
    const expectedWakuMessage = WakuMessage.fromUtf8String(
      JSON.stringify(expectedJsonRpcResult),
      contentTopics.transactResponse(chainID),
      // { timestamp: relayMessage.timestamp },
    );
    expect(expectedWakuMessage.payload).to.be.instanceof(Buffer);
    expect(rpcArgs.params[1].contentTopic).to.equal(
      contentTopics.transactResponse(chainID),
    );

    const decoded = JSON.parse(
      WakuRelayer.decode(Buffer.from(rpcArgs.params[1].payload, 'hex')),
    );
    const decodedExpected = JSON.parse(
      WakuRelayer.decode(expectedWakuMessage.payload as Uint8Array),
    );
    const resultData = await tryDecryptJSONDataWithSharedKey(
      decoded.result,
      sharedKey,
    );
    const expectedResultData = await tryDecryptJSONDataWithSharedKey(
      decodedExpected.result,
      sharedKey,
    );
    expect(resultData).to.deep.equal(expectedResultData);
  }).timeout(5000);
}).timeout(10000);
