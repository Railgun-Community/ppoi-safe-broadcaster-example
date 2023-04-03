/// <reference types="../../../global" />
import * as ed from '@noble/ed25519';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { JsonRpcRequest, JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { BigNumber } from 'ethers';
import { TransactionResponse } from '@ethersproject/providers';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import {
  verifyRelayerSignature,
  hexlify,
  toUTF8String,
  tryDecryptJSONDataWithSharedKey,
  getRailgunWalletPrivateViewingKey,
  getRandomBytes,
  getRailgunWalletAddressData,
} from '@railgun-community/quickstart';
import { WakuMethodNames, WakuRelayer, WAKU_TOPIC } from '../waku-relayer';
import {
  WakuApiClient,
  WakuRelayMessage,
  WakuRequestMethods,
} from '../../networking/waku-api-client';
import {
  encryptResponseData,
  tryDecryptData,
} from '../methods/transact-method';
import {
  setupSingleTestWallet,
  setupTestNetwork,
  testChainEthereum,
} from '../../../test/setup.test';
import { startEngine } from '../../engine/engine-init';
import configDefaults from '../../config/config-defaults';
import {
  cacheTokenPriceForNetwork,
  resetTokenPriceCache,
  TokenPriceSource,
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
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import {
  createGasBalanceStub,
  restoreGasBalanceStub,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { resetGasTokenBalanceCache } from '../../balances/balance-cache';
import {
  RelayerFeeMessage,
  RelayerFeeMessageData,
  RelayerMethodParamsTransact,
  RelayerRawParamsTransact,
} from '@railgun-community/shared-models';
import { getRelayerVersion } from '../../../util/relayer-version';
import {
  getRailgunWalletAddress,
  getRailgunWalletID,
} from '../../wallets/active-wallets';

chai.use(chaiAsPromised);
const { expect } = chai;

let wakuRelayer: Optional<WakuRelayer>;
let client: WakuApiClient;

let clientHTTPStub: SinonStub;
let processTransactionStub: SinonStub;

// @ts-ignore
let requestData: Optional<JsonRpcRequest>;

const MOCK_TOKEN_ADDRESS = '0x12345';
let network: Network;
const chain = testChainEthereum();

// eslint-disable-next-line require-await
const handleHTTPPost = async (url: string, data?: unknown) => {
  expect(url).to.equal('/');
  requestData = data as JsonRpcRequest;
  return { data: { result: {} } } as unknown as JsonRpcResult;
};

describe('waku-relayer', () => {
  before(async () => {
    configDefaults.transactionFees.feeExpirationInMS = 5 * 60 * 1000;
    startEngine();
    await setupSingleTestWallet();
    network = setupTestNetwork();
    configNetworks[chain.type][chain.id] = getMockNetwork();
    await initNetworkProviders();
    configTokens[chain.type][chain.id] = {};
    configTokens[chain.type][chain.id][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK1',
    };
    await initTokens();
    processTransactionStub = sinon
      .stub(processTransactionModule, 'processTransaction')
      .resolves({ hash: '123' } as TransactionResponse);

    client = new WakuApiClient({ url: '' });
    clientHTTPStub = sinon.stub(client.http, 'post').callsFake(handleHTTPPost);
    wakuRelayer = await WakuRelayer.init(client, {
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

  it('Should test fee broadcast', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      chain,
      MOCK_TOKEN_ADDRESS,
      {
        price: tokenPrice,
        updatedAt: Date.now(),
      },
    );
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      chain,
      network.gasToken.wrappedAddress,
      {
        price: gasTokenPrice,
        updatedAt: Date.now(),
      },
    );

    const contentTopic = '/railgun/v2/0/1/fees/json';
    expect(contentTopic).to.equal(contentTopics.fees(chain));

    await wakuRelayer?.broadcastFeesForChain(chain);
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
    const message = JSON.parse(utf8) as RelayerFeeMessage;
    const data = JSON.parse(
      toUTF8String(message.data),
    ) as RelayerFeeMessageData;
    const { signature } = message;
    expect(data).to.be.an('object');
    expect(data.fees[MOCK_TOKEN_ADDRESS]).to.be.a(
      'string',
      'No fee for token in broadcast data',
    );
    expect(BigNumber.from(data.fees[MOCK_TOKEN_ADDRESS]).toString()).to.equal(
      '1018193814430000000000',
    );
    expect(data.feeExpiration).to.be.a('number');
    expect(data.railgunAddress).to.equal(
      '0zk1qyk9nn28x0u3rwn5pknglda68wrn7gw6anjw8gg94mcj6eq5u48tlrv7j6fe3z53lama02nutwtcqc979wnce0qwly4y7w4rls5cq040g7z8eagshxrw5ajy990',
    );
    const decodedRailgunAddress = getRailgunWalletAddressData(
      data.railgunAddress,
    );
    const isValid = await verifyRelayerSignature(
      signature,
      message.data,
      decodedRailgunAddress.viewingPublicKey,
    );
    expect(isValid).to.be.true;
  }).timeout(5000);

  it('Should encrypt and decrypt data using shared keys', async () => {
    const railgunWalletID = getRailgunWalletID();
    const relayerPrivateKey =
      getRailgunWalletPrivateViewingKey(railgunWalletID);
    const relayerPublicKey = await ed.getPublicKey(relayerPrivateKey);
    const railgunWalletAddress = getRailgunWalletAddress();
    const { viewingPublicKey } =
      getRailgunWalletAddressData(railgunWalletAddress);

    const data: RelayerRawParamsTransact = {
      chainID: chain.id,
      chainType: chain.type,
      feesID: '468abc',
      minGasPrice: '0x1000',
      serializedTransaction: getMockSerializedTransaction(),
      relayerViewingKey: hexlify(viewingPublicKey),
      useRelayAdapt: false,
      devLog: true,
      minVersion: getRelayerVersion(),
      maxVersion: getRelayerVersion(),
    };
    const randomPrivKey = getRandomBytes(32);
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

  it('Should test transact method - transfer', async () => {
    const handleHTTPPost = () => {
      return { result: {} };
    };
    clientHTTPStub.callsFake(handleHTTPPost);

    const contentTopic = contentTopics.transact(chain);

    const railgunWalletID = getRailgunWalletID();
    const relayerPrivateKey =
      getRailgunWalletPrivateViewingKey(railgunWalletID);
    const relayerPublicKey = await ed.getPublicKey(relayerPrivateKey);
    const railgunWalletAddress = getRailgunWalletAddress();
    const { viewingPublicKey } =
      getRailgunWalletAddressData(railgunWalletAddress);

    const data: RelayerRawParamsTransact = {
      chainID: chain.id,
      chainType: chain.type,
      feesID: '468abc',
      minGasPrice: '0x1000',
      serializedTransaction: getMockSerializedTransaction(),
      relayerViewingKey: hexlify(viewingPublicKey),
      useRelayAdapt: false,
      devLog: true,
      minVersion: getRelayerVersion(),
      maxVersion: getRelayerVersion(),
    };
    const randomPrivKey = getRandomBytes(32);
    const randomPubKeyUint8Array = await ed.getPublicKey(randomPrivKey);
    const clientPubKey = hexlify(randomPubKeyUint8Array);
    const sharedKey = await ed.getSharedSecret(randomPrivKey, relayerPublicKey);
    const encryptedData = encryptResponseData(data, sharedKey);
    const params: RelayerMethodParamsTransact = {
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
      contentTopics.transactResponse(chain),
      // { timestamp: relayMessage.timestamp },
    );
    expect(expectedWakuMessage.payload).to.be.instanceof(Buffer);
    expect(rpcArgs.params[1].contentTopic).to.equal(
      contentTopics.transactResponse(chain),
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
