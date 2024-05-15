/// <reference types="../../../global" />
import * as ed from '@noble/ed25519';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { JsonRpcRequest, JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import {
  verifyRelayerSignature,
  hexlify,
  toUTF8String,
  tryDecryptJSONDataWithSharedKey,
  getRailgunWalletPrivateViewingKey,
  getRandomBytes,
  getRailgunWalletAddressData,
} from '@railgun-community/wallet';
import { WakuMethodNames, WakuRelayer } from '../waku-broadcaster';
import {
  WakuRestApiClient,
  WakuRelayMessage,
  WakuRequestMethods,
} from '../../networking/waku-rest-api-client';
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
import * as processTransactionModule from '../../transactions/process-transaction';
import { WakuMessage } from '../waku-message';
import { contentTopics } from '../topics';
import { getMockNetwork, mockTokenConfig } from '../../../test/mocks.test';
import { initTokens } from '../../tokens/network-tokens';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import {
  createGasBalanceStub,
  restoreGasBalanceStub,
} from '../../../test/stubs/ethers-provider-stubs.test';
import { resetGasTokenBalanceCache } from '../../balances/balance-cache';
import {
  RelayerEncryptedMethodParams,
  RelayerFeeMessage,
  RelayerFeeMessageData,
  RelayerRawParamsTransact,
  TXIDVersion,
  delay,
} from '@railgun-community/shared-models';
import { getRelayerVersion } from '../../../util/broadcaster-version';
import {
  getRailgunWalletAddress,
  getRailgunWalletID,
} from '../../wallets/active-wallets';
import { TransactionResponse } from 'ethers';

chai.use(chaiAsPromised);
const { expect } = chai;

let wakuRelayer: Optional<WakuRelayer>;
let client: WakuRestApiClient;

let clientHTTPStub: SinonStub;
let processTransactionStub: SinonStub;

type WakuMessageInTransport = WakuMessage & {
  payload: string;
};

let requestData: Optional<WakuMessageInTransport>;

const MOCK_TOKEN_ADDRESS = '0x12345';
let network: Network;
const chain = testChainEthereum();

// eslint-disable-next-line require-await
const handleHTTPPost = async (url: string, data?: unknown) => {
  requestData = data as unknown as WakuMessageInTransport;
  return { data: {}, status: 200 };
};

describe('waku-broadcaster', () => {
  before(async () => {
    configDefaults.transactionFees.feeExpirationInMS = 5 * 60 * 1000;
    await startEngine();
    await setupSingleTestWallet();
    network = setupTestNetwork();
    configNetworks[chain.type][chain.id] = getMockNetwork();
    await initNetworkProviders([chain]);
    mockTokenConfig(chain, MOCK_TOKEN_ADDRESS);
    await initTokens(chain);
    processTransactionStub = sinon
      .stub(processTransactionModule, 'processTransaction')
      .resolves({ hash: '123' } as TransactionResponse);

    client = new WakuRestApiClient({ url: '', urlBackup: '' });
    clientHTTPStub = sinon.stub(client.http, 'post').callsFake(handleHTTPPost);
    wakuRelayer = await WakuRelayer.init(client, {
      topic: configDefaults.waku.pubSubTopic,
      feeExpiration: configDefaults.transactionFees.feeExpirationInMS,
    });
    clientHTTPStub.resetHistory();
    createGasBalanceStub(10n ** 18n);
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
    expect(requestData?.contentTopic).to.equal(contentTopic);
    expect(requestData?.timestamp).to.be.a('number');
    expect(requestData?.payload).to.be.a('string');
    if (!requestData?.payload) {
      return;
    }
    const utf8 = Buffer.from(requestData.payload, 'base64').toString('utf8');
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
    expect(BigInt(data.fees[MOCK_TOKEN_ADDRESS]).toString()).to.equal(
      '990424892220000000000',
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
      txidVersion: TXIDVersion.V2_PoseidonMerkle,
      chainID: chain.id,
      chainType: chain.type,
      feesID: '468abc',
      minGasPrice: '0x1000',
      to: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
      data: '0x1234',
      relayerViewingKey: hexlify(viewingPublicKey),
      useRelayAdapt: false,
      devLog: true,
      minVersion: getRelayerVersion(),
      maxVersion: getRelayerVersion(),
      preTransactionPOIsPerTxidLeafPerList: {},
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
    clientHTTPStub.callsFake(() => {
      return { data: {}, status: 200 };
    });

    const contentTopic = contentTopics.transact(chain);

    const railgunWalletID = getRailgunWalletID();
    const relayerPrivateKey =
      getRailgunWalletPrivateViewingKey(railgunWalletID);
    const relayerPublicKey = await ed.getPublicKey(relayerPrivateKey);
    const railgunWalletAddress = getRailgunWalletAddress();
    const { viewingPublicKey } =
      getRailgunWalletAddressData(railgunWalletAddress);

    const data: RelayerRawParamsTransact = {
      txidVersion: TXIDVersion.V2_PoseidonMerkle,
      chainID: chain.id,
      chainType: chain.type,
      feesID: '468abc',
      minGasPrice: '0x1000',
      to: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
      data: '0x1234',
      relayerViewingKey: hexlify(viewingPublicKey),
      useRelayAdapt: false,
      devLog: true,
      minVersion: getRelayerVersion(),
      maxVersion: getRelayerVersion(),
      preTransactionPOIsPerTxidLeafPerList: {},
    };
    const randomPrivKey = getRandomBytes(32);
    const randomPubKeyUint8Array = await ed.getPublicKey(randomPrivKey);
    const clientPubKey = hexlify(randomPubKeyUint8Array);
    const sharedKey = await ed.getSharedSecret(randomPrivKey, relayerPublicKey);
    const encryptedData = encryptResponseData(data, sharedKey);
    const params: RelayerEncryptedMethodParams = {
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

    await delay(20000);
    // After transact-response sent.
    expect(clientHTTPStub.callCount).to.equal(1);
    const postCall = clientHTTPStub.getCall(0);
    expect(postCall.args[0]).to.equal(WakuRequestMethods.PublishMessage);
    const rpcArgs = postCall.args[1];
    expect(rpcArgs.version).to.be.a('number');
    expect(rpcArgs.contentTopic).to.equal(
      contentTopics.transactResponse(chain),
    );
    expect(rpcArgs.timestamp).to.be.an('number');
    expect(rpcArgs.payload).to.be.an('string');

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

    const decoded = JSON.parse(
      WakuRelayer.decode(Buffer.from(rpcArgs.payload, 'base64')),
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
  }).timeout(60000);
}).timeout(61000);
