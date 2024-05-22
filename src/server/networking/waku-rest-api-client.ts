import axios, { AxiosInstance } from 'axios';
import debug from 'debug';
import { WakuMessage } from '../waku-broadcaster/waku-message';
import { isDefined } from '@railgun-community/shared-models';
import { promiseTimeout } from '../../util/promise-utils';

export type WakuRelayMessage = {
  contentTopic: string;
  payload: Uint8Array;
  timestamp: number;
  version?: number;
};

export type WakuApiClientOptions = {
  url: string;
  urlBackup: string;
};

export enum WakuRequestMethods {
  DebugInfo = '/debug/v1/info', // GET
  PublishSubscription = '/relay/v1/subscriptions', // POST
  PublishMessage = '/relay/v1/messages/%2Fwaku%2F2%2Frailgun-broadcaster', // POST - requires pubsub topic
  GetMessages = '/relay/v1/messages/%2Fwaku%2F2%2Frailgun-broadcaster', // GET - requires pubsub topic
  DeleteSubscriptions = '/relay/v1/subscriptions', // DELETE
}

const MAX_RETRIES = 4;

const checkResponseStatus = (response: any, dbg: any) => {
  if (response.status === 200) {
    return;
  }
  dbg('Error Response Status: ', response);
  throw new Error(`Error Response Status: ${response.statusText}`);
};
export class WakuRestApiClient {
  dbg: debug.Debugger;

  http: AxiosInstance;

  mainNwaku: string;

  backupNwaku: string;

  constructor(options: WakuApiClientOptions) {
    this.dbg = debug('broadcaster:waku:REST-api');
    this.mainNwaku = options.url;
    this.backupNwaku = options.urlBackup;
    const httpConfig = {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' },
    };
    this.http = axios.create(httpConfig);
    this.dbg('Relaying via ', options.url);
  }

  async post(path: string, data: any) {
    const response = await promiseTimeout(
      this.http.post(path, data),
      10 * 1000,
    );
    checkResponseStatus(response, this.dbg);
    return response.data;
  }

  async get(path: string) {
    const response = await promiseTimeout(this.http.get(path), 10 * 1000);
    checkResponseStatus(response, this.dbg);
    return response.data;
  }

  async delete(path: string, data: any) {
    const response = await promiseTimeout(
      this.http.delete(path, { data }),
      10 * 1000,
    );
    checkResponseStatus(response, this.dbg);
    return response.data;
  }

  static determineRequestType(method: string) {
    switch (method) {
      case WakuRequestMethods.DebugInfo:
      case WakuRequestMethods.GetMessages: {
        return 'GET';
      }
      case WakuRequestMethods.PublishSubscription:
      case WakuRequestMethods.PublishMessage: {
        return 'POST';
      }
      case WakuRequestMethods.DeleteSubscriptions: {
        return 'DELETE';
      }
      default: {
        return 'GET';
      }
    }
  }

  async request(
    method: string,
    requestType: string,
    params: any,
    retry = 0,
  ): Promise<any> {
    const baseURL = retry === 0 ? this.mainNwaku : this.backupNwaku;
    const formattedURL = `${baseURL}${method}`;
    try {
      switch (requestType) {
        case 'GET': {
          const response = await this.get(formattedURL);
          return response;
        }
        case 'POST': {
          const response = await this.post(formattedURL, params);
          return response;
        }
        case 'DELETE': {
          const response = await this.delete(formattedURL, params);
          return response;
        }
        default: {
          const response = await this.get(formattedURL);
          return response;
        }
      }
    } catch (err) {
      if (retry < MAX_RETRIES) {
        this.dbg(
          'Error posting to relay-api. Retrying.',
          formattedURL,
          err.message,
        );
        return this.request(method, requestType, params, retry + 1);
      }
      this.dbg('Error posting to relay-api', formattedURL, err.message);
      throw Error(err.message);
    }
  }

  async getDebug(): Promise<string[]> {
    const data = await this.request(WakuRequestMethods.DebugInfo, 'GET', []);
    if (isDefined(data)) {
      return data.listenAddresses;
    }
    this.dbg(
      'There was an error gathering addresses from debug info. Returning empty array.',
    );
    return [];
  }

  async unsubscribe(topics: string[]) {
    const data = await this.request(
      WakuRequestMethods.DeleteSubscriptions,
      'DELETE',
      [topics],
    );
    return data;
  }

  async subscribe(topics: string[]) {
    const data = await this.request(
      WakuRequestMethods.PublishSubscription,
      'POST',
      topics,
    );
    await this.request(
      WakuRequestMethods.PublishSubscription,
      'POST',
      topics,
      1,
    ); // publish on nwaku2 as well
    return data;
  }

  /**
   * publish a js-waku WakuMessage to pubsub topic
   * @todo be less convenient and don't depend on js-waku
   */
  async publish(message: WakuMessage, topic: string) {
    if (!message.payload) {
      this.dbg('Tried to publish empty message');
      return false;
    }
    const { timestamp } = message;
    const payload = Buffer.from(message.payload).toString('base64');
    const { contentTopic } = message;
    if (contentTopic?.includes('fees') === true) {
      // we have fee message.. dont try to resend.
      const data = await this.request(
        WakuRequestMethods.PublishMessage,
        'POST',
        { payload, timestamp, version: 0, contentTopic },
        MAX_RETRIES,
      );
      return data;
    }

    const data = await this.request(WakuRequestMethods.PublishMessage, 'POST', {
      payload,
      timestamp,
      version: 0,
      contentTopic,
    });
    return data;
  }

  static fromJSON(obj: any): WakuRelayMessage {
    const msg: WakuRelayMessage = {
      contentTopic: obj.contentTopic,
      payload: Buffer.from(obj?.payload ?? [], 'base64'),
      version: obj.version ?? 0,
      timestamp: obj.timestamp ?? undefined,
    };
    return msg;
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
    const data = await this.request(WakuRequestMethods.GetMessages, 'GET', []);

    if (isDefined(data.error)) {
      throw data.error;
    }
    const messages: WakuRelayMessage[] = data.map(WakuRestApiClient.fromJSON);

    if (!isDefined(messages)) {
      this.dbg('No messages, got data:', data);
      return [];
    }

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
