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
} from 'services/networking/waku-api-client';
import { WakuMessage } from 'js-waku';
import { greetMethod } from './methods/greet-method';
import { processTransactionMethod } from './methods/populate-transaction-method';

export const ContentTopics = {
  default: '/railgun/1/default/json',
  greet: '/railgun/1/greet/json',
  fees: '/railgun/1/fees/json',
};
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

  contentTopics: string[];

  methods: MapType<JsonRPCMessageHandler> = {
    greet: greetMethod,
    processTransaction: processTransactionMethod,
  };

  constructor(client: WakuApiClient, options: WakuRelayerOptions) {
    this.client = client;
    this.logger = debug('relayer:waku:relayer');
    this.topic = options.topic;
    this.contentTopics = Object.values(ContentTopics);
  }

  static async init(options: WakuRelayerOptions): Promise<WakuRelayer> {
    const client = await WakuApiClient.init(options);
    await client.subscribe([options.topic]);
    const relayer = new WakuRelayer(client, options);
    relayer.poll(options.pollFrequency);
    relayer.broadcastFees({ usd: 1 });
    return relayer;
  }

  async request(
    method: string,
    params: any,
    contentTopic = ContentTopics.default,
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

  // TODO: Fix this any with a type.
  async broadcastFees(feesObj: any, frequency: number = 15 * 1000) {
    setInterval(async () => {
      const message = await WakuMessage.fromUtf8String(
        JSON.stringify(feesObj),
        ContentTopics.fees,
      );
      const result = await this.client
        .publish(message, this.topic)
        .catch(this.logger);
      this.logger('broadcasting fees: ', result);
    }, frequency);
  }

  async poll(frequency: number = 5000) {
    setInterval(async () => {
      const messages = await this.client
        .getMessages(this.topic, this.contentTopics)
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
