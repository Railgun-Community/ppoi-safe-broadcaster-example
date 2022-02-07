import axios, { AxiosInstance } from 'axios';
import { formatJsonRpcRequest } from '@walletconnect/jsonrpc-utils';
import { WakuMessage } from 'js-waku';
import axiosRetry from 'axios-retry';
import debug from 'debug';

export type WakuRelayMessage = {
  contentTopic: string;
  payload: Uint8Array;
  proof: Uint8Array;
  timestamp: number;
  version: number;
};

export type WakuApiClientOptions = {
  url: string;
};

export class WakuApiClient {
  logger: debug.Debugger;
  http: AxiosInstance;

  constructor(options: WakuApiClientOptions) {
    this.logger = debug('waku:jsonrpc-api');
    const httpConfig = {
      timeout: 10000,
      baseURL: options.url,
      headers: { 'Content-Type': 'application/json' },
    };
    this.http = axios.create(httpConfig);
    axiosRetry(this.http, { retries: 4 });
    this.logger('Relaying via ', options.url);
  }

  async request(method: string, params: any) {
    const req = formatJsonRpcRequest(method, params);
    try {
      const response = await this.http.post('/', req);
      return response.data;
    } catch (e: any) {
      this.logger('Error posting to relay-api', req, e.message);
      throw e;
    }
  }

  async getDebug() {
    const data = await this.request('get_waku_v2_debug_v1_info', []);
    const { result } = data;
    return result.listenAddresses;
  }

  async subscribe(topics: string[]) {
    this.logger('subscribing to topics', topics);
    const data = await this.request('post_waku_v2_relay_v1_subscriptions', [
      topics,
    ]);

    const { result } = data;
    return result;
  }

  /**
   * publish a js-waku WakuMessage to pubsub topic
   * @todo be less convenient and don't depend on js-waku
   */
  async publish(message: WakuMessage, topic: string) {
    if (!message.timestamp || !message.payload) {
      return;
    }
    const timestamp = message.timestamp.getTime() / 1000;
    const payload = Buffer.from(message.payload).toString('hex');
    const { contentTopic } = message;
    this.logger('publishing to contentTopic', contentTopic);
    const data = await this.request('post_waku_v2_relay_v1_message', [
      topic,
      { payload, timestamp, contentTopic },
    ]);
    return data.result;
  }

  /**
   * retrieve messages collected since last call
   * this is not Filter API - the rpc node returns all messages on the pubsub topic
   *
   * however, specifying contentTopics locally filters out uninteresting messages before return
   */
  async getMessages(
    topic: string,
    contentTopics: string[] = [],
  ): Promise<WakuRelayMessage[]> {
    const data = await this.request('get_waku_v2_relay_v1_messages', [topic]);

    const messages: WakuRelayMessage[] = data.result;
    // if contentTopics given, return only matching messages
    if (contentTopics.length) {
      return messages.filter((message: WakuRelayMessage) =>
        contentTopics.includes(message.contentTopic),
      );
    }
    // otherwise return messages of all contentTopics (including ping etc)
    return messages;
  }
}
