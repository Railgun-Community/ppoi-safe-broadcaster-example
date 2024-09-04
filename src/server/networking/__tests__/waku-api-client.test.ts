import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { WakuApiClient, WakuRelayMessage } from '../waku-api-client';
import {
  setupSingleTestWallet,
  setupTestNetwork,
  testChainEthereum,
} from '../../../test/setup.test';
import { startEngine } from '../../engine/engine-init';
import configDefaults from '../../config/config-defaults';
import { resetTokenPriceCache } from '../../tokens/token-price-cache';
import { resetTransactionFeeCache } from '../../fees/transaction-fee-cache';
import configTokens from '../../config/config-tokens';
import { initTokens } from '../../tokens/network-tokens';
import { getMockNetwork } from '../../../test/mocks.test';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';

chai.use(chaiAsPromised);
const { expect } = chai;

let client: WakuApiClient;

let clientHTTPStub: SinonStub;

const MOCK_TOKEN_ADDRESS = '0x12345';
const MOCK_CHAIN = testChainEthereum();

describe('waku-api-client', () => {
  before(async () => {
    configDefaults.transactionFees.feeExpirationInMS = 5 * 60 * 1000;
    await startEngine();
    await setupSingleTestWallet();
    configTokens[MOCK_CHAIN.type][MOCK_CHAIN.id][MOCK_TOKEN_ADDRESS] = {
      symbol: 'MOCK1',
    };
    await initTokens(MOCK_CHAIN);

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
        payload: Buffer.from('', 'base64'),
        timestamp: 456,
      },
    ];
    clientHTTPStub.resolves({ data: { result } });
    const messages = await client.getMessages('', ['abc']);
    expect(messages.length).to.equal(1);
    expect(messages[0].timestamp).to.equal(123);
  });
}).timeout(60000);
