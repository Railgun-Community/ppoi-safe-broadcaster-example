import {
  formatJsonRpcRequest,
  formatJsonRpcResult,
} from '@walletconnect/jsonrpc-utils';
import { JsonRpcPayload, JsonRpcResult } from '@walletconnect/jsonrpc-types';
import debug from 'debug';
import {
  WakuApiClient,
  WakuApiClientOptions,
  WakuRelayMessage,
} from 'server/networking/waku-api-client';
import { WakuMessage } from 'js-waku';
import { greetMethod } from './methods/greet-method';
import { transactMethod } from './methods/transact-method';
import { NetworkChainID } from '../config/config-chain-ids';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import { getAllUnitTokenFeesForChain } from '../fees/calculate-token-fee';
import { delay } from '../../util/promise-utils';
import configDefaults from '../config/config-defaults';
import { contentTopics } from './topics';

export const WAKU_TOPIC = '/waku/2/default-waku/proto';
export const RAILGUN_TOPIC = '/railgun/1/relayer/proto';

type JsonRPCMessageHandler = (
  params: any,
  id: number,
  logger: debug.Debugger,
) => Promise<JsonRpcResult<string>>;

export type WakuRelayerOptions = {
  topic: string;
  pollFrequency: number;
} & WakuApiClientOptions;

export class WakuRelayer {
  client: WakuApiClient;
  logger: debug.Debugger;
  topic: string;
  allContentTopics: string[];

  methods: MapType<JsonRPCMessageHandler> = {
    greet: greetMethod,
    transact: transactMethod,
  };

  constructor(client: WakuApiClient, options: WakuRelayerOptions) {
    const chainIDs = configuredNetworkChainIDs();
    this.client = client;
    this.logger = debug('relayer:waku:relayer');
    this.topic = options.topic;
    this.allContentTopics = [
      contentTopics.default(),
      contentTopics.greet(),
      ...chainIDs.map((chainID) => contentTopics.fees(chainID)),
      ...chainIDs.map((chainID) => contentTopics.transact(chainID)),
    ];
    this.logger(this.allContentTopics);
  }

  static async init(options: WakuRelayerOptions): Promise<WakuRelayer> {
    const client = new WakuApiClient(options);
    await client.subscribe([options.topic]);
    const relayer = new WakuRelayer(client, options);
    relayer.poll(options.pollFrequency);
    relayer.broadcastFeesOnInterval();
    return relayer;
  }

  async request(
    method: string,
    params: any,
    contentTopic = contentTopics.default(),
  ) {
    const payload: JsonRpcPayload = formatJsonRpcRequest(method, params);
    const msg = await WakuMessage.fromUtf8String(
      JSON.stringify(payload),
      contentTopic,
    );
    await this.client.publish(msg, this.topic);
  }

  static decode(payload: Uint8Array): string {
    return Buffer.from(payload).toString('utf8');
  }

  async handleMessage(message: WakuRelayMessage) {
    const { payload, contentTopic, timestamp } = message;

    try {
      const decoded = WakuRelayer.decode(payload);
      const request = JSON.parse(decoded);
      const { method, params, id } = request;

      if (method in this.methods) {
        const age = Date.now() / 1000 - timestamp;
        this.logger(`handling message on ${contentTopic} (${age}s old)`);
        const response = await this.methods[method](params, id, this.logger);
        const rpcResult = await WakuMessage.fromUtf8String(
          JSON.stringify(response),
          contentTopic,
        );
        await this.client.publish(rpcResult, this.topic).catch((e) => {
          this.logger('Error publishing response', e.message);
        });
      }
    } catch (e) {
      this.logger('caught error', e);
    }
  }

  private async broadcastFeesForChain(chainID: NetworkChainID) {
    // Map from tokenAddress to BigNumber hex string
    const fees: MapType<string> = getAllUnitTokenFeesForChain(chainID);
    const feesString = JSON.stringify(fees);
    const message = await WakuMessage.fromUtf8String(
      feesString,
      contentTopics.fees(chainID),
    );
    const result = await this.client
      .publish(message, this.topic)
      .catch(this.logger);
    this.logger(`Broadcasting fees for chain ${chainID}: `, feesString);
    this.logger(`Result: ${result}`);
  }

  async broadcastFeesOnInterval() {
    await delay(configDefaults.broadcastFeesDelayInMS);
    const chainIDs = configuredNetworkChainIDs();
    const broadcastPromises: Promise<void>[] = chainIDs.map((chainID) =>
      this.broadcastFeesForChain(chainID),
    );
    await Promise.all(broadcastPromises);
    this.broadcastFeesOnInterval();
  }

  async poll(frequency: number = 5000) {
    setInterval(async () => {
      this.logger(this.allContentTopics);
      const messages = await this.client
        .getMessages(this.topic, this.allContentTopics)
        .catch((e) => {
          this.logger(e.message);
          return [];
        });
      await Promise.all(
        messages.map(async (message) => {
          this.handleMessage(message);
        }),
      );
    }, frequency);
  }
}
