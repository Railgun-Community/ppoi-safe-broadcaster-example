/// <reference types="../../../global" />
/* globals describe, before, after, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { JsonRpcRequest, JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { WakuApiClient, WakuRelayMessage } from '../waku-api-client';
import {
  setupSingleTestWallet,
  setupTestNetwork,
  testChainID,
} from '../../../test/setup.test';
import { initLepton } from '../../lepton/lepton-init';
import configDefaults from '../../config/config-defaults';
import { resetTokenPriceCache } from '../../tokens/token-price-cache';
import { resetTransactionFeeCache } from '../../fees/transaction-fee-cache';
import { Network } from '../../../models/network-models';
import configTokens from '../../config/config-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

let client: WakuApiClient;

let clientHTTPStub: SinonStub;

const MOCK_TOKEN_ADDRESS = '0x12345';
let network: Network;
const chainID = testChainID();

describe('waku-api-client', () => {
  before(async () => {
    configDefaults.transactionFees.feeExpirationInMS = 5 * 60 * 1000;
    initLepton();
    await setupSingleTestWallet();
    network = setupTestNetwork();
    configTokens[chainID][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK1',
      decimals: 18,
    };

    client = new WakuApiClient({ url: '' });
    clientHTTPStub = sinon.stub(client.http, 'post');
  });

  afterEach(() => {
    clientHTTPStub.resetBehavior();
    clientHTTPStub.resetHistory();
  });

  after(() => {
    clientHTTPStub.restore();
    resetTokenPriceCache();
    resetTransactionFeeCache();
  });

  it('Should test request retry eventually resolves', async () => {
    clientHTTPStub.onCall(0).throws();
    clientHTTPStub.onCall(1).throws();
    clientHTTPStub.onCall(2).throws();
    clientHTTPStub.onCall(3).resolves({ data: { result: {} } });
    await expect(client.request('test', {})).to.be.fulfilled;
  });

  it('Should test failing request eventually rejects', async () => {
    clientHTTPStub.throws();
    await expect(client.request('test', {})).to.be.rejected;
  });

  it('Should test get-debug', async () => {
    clientHTTPStub.resolves({ data: { result: { listenAddresses: ['123'] } } });
    const debug = await client.getDebug();
    expect(debug.length).to.equal(1);
    expect(debug[0]).to.equal('123');
  });

  it('Should test get-messages', async () => {
    const result: WakuRelayMessage[] = [
      {
        contentTopic: 'abc',
        payload: Buffer.from(''),
        timestamp: 123,
      },
      {
        contentTopic: 'def',
        payload: Buffer.from(''),
        timestamp: 456,
      },
    ];
    clientHTTPStub.resolves({ data: { result } });
    const messages = await client.getMessages('', ['abc']);
    expect(messages.length).to.equal(1);
    expect(messages[0].timestamp).to.equal(123);
  });
}).timeout(10000);
