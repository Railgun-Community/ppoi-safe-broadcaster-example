import { JsonRpcPayload } from '@walletconnect/jsonrpc-types';
import debug from 'debug';

import {
  BroadcasterFeeMessage,
  BroadcasterFeeMessageData,
  isDefined,
  networkForChain,
} from '@railgun-community/shared-models';
import {
  POIRequired,
  fromUTF8String,
  signWithWalletViewingKey,
} from '@railgun-community/wallet';
import { BroadcasterChain } from '../../models/chain-models';
import { delay, promiseTimeout } from '../../util/promise-utils';
import { getBroadcasterVersion } from '../../util/broadcaster-version';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { getAllUnitTokenFeesForChain } from '../fees/calculate-token-fee';
import {
  WakuRestApiClient,
  WakuRelayMessage,
} from '../networking/waku-rest-api-client';
import {
  getRailgunWalletAddress,
  getRailgunWalletID,
  numAvailableWallets,
} from '../wallets/active-wallets';
import { transactMethod } from './methods/transact-method';
import { contentTopics } from './topics';
import { WakuMessage } from './waku-message';
import { WakuMethodResponse } from './waku-response';
import { getReliabilityRatio } from '../../util/reliability';
import { METRICS_TOPIC, metricsMethod } from './methods/metrics-method';

type JsonRPCMessageHandler = (
  params: any,
  id: number,
  incomingChain: BroadcasterChain,
) => Promise<Optional<WakuMethodResponse>>;

export enum WakuMethodNames {
  Transact = 'transact',
  Metrics = 'metrics',
}

export type WakuBroadcasterOptions = {
  topic: string;
  feeExpiration: number;
};

export class WakuBroadcaster {
  client: WakuRestApiClient;

  dbg: debug.Debugger;

  subscribedContentTopics: string[];

  railgunWalletAddress: string;

  railgunWalletID: string;

  identifier: Optional<string> = configDefaults.instanceIdentifier.length
    ? configDefaults.instanceIdentifier
    : undefined;

  options: WakuBroadcasterOptions;

  methods: MapType<JsonRPCMessageHandler> = {
    [WakuMethodNames.Transact]: transactMethod,
    [WakuMethodNames.Metrics]: metricsMethod,
  };

  stopping = false;

  constructor(client: WakuRestApiClient, options: WakuBroadcasterOptions) {
    const chainIDs = configuredNetworkChains();
    this.client = client;
    this.options = options;
    this.dbg = debug('broadcaster:waku:broadcaster');
    this.subscribedContentTopics = [
      ...chainIDs.map((chainID) => contentTopics.transact(chainID)),
      contentTopics.encrypted(METRICS_TOPIC),
    ];
    this.railgunWalletAddress = getRailgunWalletAddress();
    this.railgunWalletID = getRailgunWalletID();
    this.dbg(this.subscribedContentTopics);
  }

  static async init(
    client: WakuRestApiClient,
    options: WakuBroadcasterOptions,
  ): Promise<WakuBroadcaster> {
    const broadcaster = new WakuBroadcaster(client, options);
    await broadcaster.subscribe();
    return broadcaster;
  }

  async stop() {
    this.stopping = true;
    await this.unsubscribe();
  }

  async subscribe() {
    return await this.client.subscribe([this.options.topic]);
  }

  async unsubscribe() {
    return await this.client.unsubscribe([this.options.topic]);
  }

  async publish(
    payload: Optional<JsonRpcPayload<string>> | object,
    contentTopic: string,
    isResponse = false,
  ): Promise<void> {
    if (!payload) {
      return;
    }

    if (isResponse) {
      for (let i = 0; i < 5; i += 1) {
        const msg = WakuMessage.fromUtf8String(
          JSON.stringify(payload),
          contentTopic,
        );
        // eslint-disable-next-line no-await-in-loop
        await this.client
          .publish(msg, this.options.topic)
          .then(() => this.dbg('Published TX RESPONSE'))
          .catch((e) => {
            this.dbg('Error publishing message', e.message);
          });
        // eslint-disable-next-line no-await-in-loop
        await delay(3000);
      }
    } else {
      const msg = WakuMessage.fromUtf8String(
        JSON.stringify(payload),
        contentTopic,
      );
      return this.client.publish(msg, this.options.topic).catch((e) => {
        this.dbg('Error publishing message', e.message);
      });
    }
  }

  static decode(payload: Uint8Array): string {
    return Buffer.from(payload).toString('utf8');
  }

  async handleMessage(message: WakuRelayMessage): Promise<void> {
    const { payload, contentTopic } = message;

    try {
      const decoded = WakuBroadcaster.decode(payload);
      const request = JSON.parse(decoded);
      const { method, params, id } = request;

      if (method in this.methods) {
        this.dbg(`Received message on ${contentTopic}`);
        const rawTopic = contentTopic.split('/');
        const incomingChain: any = {};
        if (method.includes('metrics') === true) {
          // no chain info in topic.
          incomingChain.type = 0;
          incomingChain.id = 1;
        } else {
          incomingChain.type = parseInt(rawTopic[3], 10);
          incomingChain.id = parseInt(rawTopic[4], 10);
        }
        const response = await this.methods[method](params, id, incomingChain);
        if (response) {
          await this.publish(response.rpcResult, response.contentTopic, true);
        }
      }
    } catch (e) {
      this.dbg('Caught error', e);
    }
  }

  private createFeeBroadcastData = async (
    fees: MapType<bigint>,
    feeCacheID: string,
    chain: BroadcasterChain,
    reliability: number,
  ): Promise<BroadcasterFeeMessage> => {
    const tokenAddresses = Object.keys(fees);
    const feesHex: MapType<string> = {};
    tokenAddresses.forEach((tokenAddress) => {
      feesHex[tokenAddress] = `0x${fees[tokenAddress].toString(16)}`;
    });

    // Availability must be accurate or Broadcaster risks automatic blocking by clients.
    const availableWallets = await numAvailableWallets(chain);

    const network = networkForChain(chain);
    if (!network) {
      throw new Error('No network found');
    }
    // DO NOT CHANGE : Required in order to make broadcaster fees spendable
    const requiredPOIListKeys = await POIRequired.getRequiredListKeys(
      network.name,
    );

    const data: BroadcasterFeeMessageData = {
      fees: feesHex,
      // client can't rely on message timestamp to calculate expiration
      feeExpiration: Date.now() + this.options.feeExpiration,
      feesID: feeCacheID,
      railgunAddress: this.railgunWalletAddress,
      identifier: this.identifier,
      availableWallets,
      version: getBroadcasterVersion(),
      relayAdapt: configNetworks[chain.type][chain.id].relayAdaptContract,
      requiredPOIListKeys, // DO NOT CHANGE : Required in order to make broadcaster fees spendable
      reliability,
    };
    const message = fromUTF8String(JSON.stringify(data));
    const signature = await signWithWalletViewingKey(
      this.railgunWalletID,
      message,
    );
    this.dbg(
      `Broadcasting fees for chain ${chain.type}:${chain.id}: Tokens ${
        Object.keys(fees).length
      }, Available Wallets ${availableWallets} | Reliability: ${reliability}`,
    );
    return {
      data: message,
      signature,
    };
  };

  async broadcastFeesForChain(chain: BroadcasterChain): Promise<void> {
    // Map from tokenAddress to BigNumber hex string
    const { fees, feeCacheID } = getAllUnitTokenFeesForChain(chain);
    const reliability = await getReliabilityRatio(chain);
    const feeBroadcastData = await promiseTimeout(
      this.createFeeBroadcastData(fees, feeCacheID, chain, reliability),
      3 * 1000,
    )
      .then((result: BroadcasterFeeMessage) => {
        return result;
      })
      .catch((err: Error) => {
        this.dbg(err.message);
        return undefined;
      });
    if (!isDefined(feeBroadcastData)) {
      return;
    }
    const contentTopic = contentTopics.fees(chain);
    return this.publish(feeBroadcastData, contentTopic);
  }

  async broadcastFeesOnInterval(interval: number): Promise<void> {
    if (this.stopping) {
      return;
    }
    const chains = configuredNetworkChains();
    this.dbg('BroadcastingFees:');
    for (const chain of chains) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await promiseTimeout(this.broadcastFeesForChain(chain), 3 * 1000).catch(
          (error) => {
            this.dbg(`Waku Failed Broadcast ${error.message}`);
          },
        );
        // eslint-disable-next-line no-await-in-loop
        await delay(300);
      } catch (error) {
        this.dbg('BROADCASTFAIL', error.message);
      }
    }

    await delay(interval);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.broadcastFeesOnInterval(interval);
  }

  async poll(frequency: number): Promise<void> {
    if (this.stopping) {
      this.dbg('Sopping polling');
      return;
    }
    this.dbg('Polling for messages');
    const messages = await this.client
      .getMessages(this.options.topic, this.subscribedContentTopics)
      .catch(async (e) => {
        this.dbg(e.message);
        this.dbg('type', typeof e.code);
        if (e.code === -32000) {
          this.dbg('resubscribing.. ');
          await this.subscribe();
        }
        return [];
      });
    if (messages.length > 0) {
      this.dbg('Received messages:', messages.length);
    }
    for (const message of messages) {
      // eslint-disable-next-line no-await-in-loop
      this.handleMessage(message).catch((err) => {
        this.dbg(err);
      });
      // eslint-disable-next-line no-await-in-loop
      await delay(250);
    }
    await delay(frequency);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.poll(frequency);
  }
}
