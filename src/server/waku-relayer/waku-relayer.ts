import debug from 'debug';
import { JsonRpcPayload } from '@walletconnect/jsonrpc-types';
import { BigNumber } from 'ethers';
import {
  fromUTF8String,
  hexlify,
  hexStringToBytes,
  RailgunWallet,
} from '@railgun-community/engine';
import { WakuApiClient, WakuRelayMessage } from '../networking/waku-api-client';
import { transactMethod } from './methods/transact-method';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { getAllUnitTokenFeesForChain } from '../fees/calculate-token-fee';
import { delay } from '../../util/promise-utils';
import { contentTopics } from './topics';
import { numAvailableWallets } from '../wallets/active-wallets';
import { WakuMessage } from './waku-message';
import { WakuMethodResponse } from './waku-response';
import configNetworks from '../config/config-networks';
import configDefaults from '../config/config-defaults';
import { RelayerChain } from '../../models/chain-models';

export const WAKU_TOPIC = '/waku/2/default-waku/proto';

export type FeeMessageData = {
  fees: MapType<string>;
  feeExpiration: number;
  feesID: string;
  railAddress: string;
  availableWallets: number;
  version: string;
  relayAdapt: string;
};

export type FeeMessage = {
  data: string; // hex encoded FeeMessageData
  signature: string; // hex encoded signature
};

type JsonRPCMessageHandler = (
  params: any,
  id: number,
) => Promise<Optional<WakuMethodResponse>>;

export enum WakuMethodNames {
  Transact = 'transact',
}

export type WakuRelayerOptions = {
  topic: string;
  feeExpiration: number;
};

export class WakuRelayer {
  client: WakuApiClient;

  dbg: debug.Debugger;

  subscribedContentTopics: string[];

  walletRailAddress: string;

  options: WakuRelayerOptions;

  wallet: RailgunWallet;

  methods: MapType<JsonRPCMessageHandler> = {
    [WakuMethodNames.Transact]: transactMethod,
  };

  stopping = false;

  constructor(
    client: WakuApiClient,
    wallet: RailgunWallet,
    options: WakuRelayerOptions,
  ) {
    const chainIDs = configuredNetworkChains();
    this.client = client;
    this.options = options;
    this.dbg = debug('relayer:waku:relayer');
    this.subscribedContentTopics = [
      ...chainIDs.map((chainID) => contentTopics.transact(chainID)),
    ];
    this.wallet = wallet;
    this.walletRailAddress = wallet.getAddress();
    this.dbg(this.subscribedContentTopics);
  }

  static async init(
    client: WakuApiClient,
    wallet: RailgunWallet,
    options: WakuRelayerOptions,
  ): Promise<WakuRelayer> {
    const relayer = new WakuRelayer(client, wallet, options);
    await relayer.subscribe();
    return relayer;
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
  ) {
    const msg = WakuMessage.fromUtf8String(
      JSON.stringify(payload),
      contentTopic,
    );
    return await this.client.publish(msg, WAKU_TOPIC).catch((e) => {
      this.dbg('Error publishing message', e.message);
    });
  }

  static decode(payload: Uint8Array): string {
    return Buffer.from(payload).toString('utf8');
  }

  async handleMessage(message: WakuRelayMessage) {
    const { payload, contentTopic } = message;

    try {
      const decoded = WakuRelayer.decode(payload);
      const request = JSON.parse(decoded);
      const { method, params, id } = request;

      if (method in this.methods) {
        this.dbg(`Received message on ${contentTopic}`);
        const response = await this.methods[method](params, id);
        if (response) {
          await this.publish(response.rpcResult, response.contentTopic);
        }
      }
    } catch (e) {
      this.dbg('Caught error', e);
    }
  }

  // eslint-disable-next-line require-await
  private createFeeBroadcastData = async (
    fees: MapType<BigNumber>,
    feeCacheID: string,
    chain: RelayerChain,
  ): Promise<FeeMessage> => {
    const tokenAddresses = Object.keys(fees);
    const feesHex: MapType<string> = {};
    tokenAddresses.forEach((tokenAddress) => {
      feesHex[tokenAddress] = fees[tokenAddress].toHexString();
    });

    // Availability must be accurate or Relayer risks automatic blocking by clients.
    const availableWallets = await numAvailableWallets(chain);

    const data: FeeMessageData = {
      fees: feesHex,
      // client can't rely on message timestamp to calculate expiration
      feeExpiration: Date.now() + this.options.feeExpiration,
      feesID: feeCacheID,
      railAddress: this.walletRailAddress,
      availableWallets,
      version: process.env.npm_package_version ?? '0.0.0',
      relayAdapt: configDefaults.featureFlags.enableRelayAdapt
        ? configNetworks[chain.type][chain.id].relayAdaptContract
        : '',
    };
    const message = fromUTF8String(JSON.stringify(data));
    const signature = hexlify(
      await this.wallet.signWithViewingKey(hexStringToBytes(message)),
    );
    this.dbg(
      `Broadcasting fees for chain ${chain.type}:${chain.id}:`,
      Object.keys(fees).length,
    );
    return {
      data: message,
      signature,
    };
  };

  async broadcastFeesForChain(chain: RelayerChain) {
    // Map from tokenAddress to BigNumber hex string
    const { fees, feeCacheID } = getAllUnitTokenFeesForChain(chain);
    const feeBroadcastData = await this.createFeeBroadcastData(
      fees,
      feeCacheID,
      chain,
    );
    const contentTopic = contentTopics.fees(chain);
    await this.publish(feeBroadcastData, contentTopic);
  }

  async broadcastFeesOnInterval(interval: number) {
    if (this.stopping) return;
    const chains = configuredNetworkChains();
    const broadcastPromises: Promise<void>[] = chains.map((chain) =>
      this.broadcastFeesForChain(chain),
    );

    await Promise.all(broadcastPromises);
    await delay(interval);
    this.broadcastFeesOnInterval(interval);
  }

  async poll(frequency: number) {
    if (this.stopping) return;
    const messages = await this.client
      .getMessages(WAKU_TOPIC, this.subscribedContentTopics)
      .catch(async (e) => {
        this.dbg(e.message);
        this.dbg('type', typeof e.code);
        if (e.code === -32000) {
          this.dbg('resubscribing.. ');
          await this.subscribe();
        }
        return [];
      });
    await Promise.all(messages.map((message) => this.handleMessage(message)));
    await delay(frequency);
    this.poll(frequency);
  }
}
