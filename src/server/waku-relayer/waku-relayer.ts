import { JsonRpcPayload, JsonRpcResult } from '@walletconnect/jsonrpc-types';
import debug from 'debug';
import { BigNumber } from 'ethers';
import { WakuApiClient, WakuRelayMessage } from '../networking/waku-api-client';
import { transactMethod } from './methods/transact-method';
import { NetworkChainID } from '../config/config-chain-ids';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import { getAllUnitTokenFeesForChain } from '../fees/calculate-token-fee';
import { delay } from '../../util/promise-utils';
import configDefaults from '../config/config-defaults';
import { contentTopics } from './topics';
import { getRailgunWalletPubKey } from '../wallets/active-wallets';
import { WakuMessage } from './waku-message';

export const WAKU_TOPIC = '/waku/2/default-waku/proto';
export const RAILGUN_TOPIC = '/railgun/1/relayer/proto';

export type FeeBroadcastData = {
  fees: MapType<string>;
  feeExpiration: number;
  feesID: string;
  pubkey: string;
  encryptedHash: string;
};

type JsonRPCMessageHandler = (
  params: any,
  id: number,
  logger: debug.Debugger,
) => Promise<Optional<JsonRpcResult<string>>>;

export enum WakuMethodNames {
  Transact = 'transact',
}

export type WakuRelayerOptions = {
  topic: string;
};

export class WakuRelayer {
  client: WakuApiClient;

  dbg: debug.Debugger;

  topic: string;

  allContentTopics: string[];

  walletPublicKey: string;

  methods: MapType<JsonRPCMessageHandler> = {
    [WakuMethodNames.Transact]: transactMethod,
  };

  constructor(client: WakuApiClient, options: WakuRelayerOptions) {
    const chainIDs = configuredNetworkChainIDs();
    this.client = client;
    this.dbg = debug('relayer:waku:relayer');
    this.topic = options.topic;
    this.allContentTopics = [
      contentTopics.default(),
      ...chainIDs.map((chainID) => contentTopics.fees(chainID)),
      ...chainIDs.map((chainID) => contentTopics.transact(chainID)),
    ];
    this.walletPublicKey = getRailgunWalletPubKey();
    this.dbg(this.allContentTopics);
  }

  static async init(
    client: WakuApiClient,
    options: WakuRelayerOptions,
  ): Promise<WakuRelayer> {
    await client.subscribe([options.topic]);
    const relayer = new WakuRelayer(client, options);
    relayer.poll(configDefaults.waku.pollFrequencyInMS);
    relayer.broadcastFeesOnInterval();
    return relayer;
  }

  async publish(
    payload: Optional<JsonRpcPayload<string>> | object,
    contentTopic: string,
  ) {
    const msg = WakuMessage.fromUtf8String(
      JSON.stringify(payload),
      contentTopic,
    );
    await this.client.publish(msg, this.topic).catch((e) => {
      this.dbg('Error publishing message', e.message);
    });
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
        this.dbg(`handling message on ${contentTopic} (${age}s old)`);
        const rpcResultResponse = await this.methods[method](
          params,
          id,
          this.dbg,
        );
        await this.publish(rpcResultResponse, contentTopic);
      }
    } catch (e) {
      this.dbg('Caught error', e);
    }
  }

  private createFeeBroadcastData = (
    fees: MapType<BigNumber>,
    feeCacheID: string,
  ): FeeBroadcastData => {
    const tokenAddresses = Object.keys(fees);
    const feesHex: MapType<string> = {};
    tokenAddresses.forEach((tokenAddress) => {
      feesHex[tokenAddress] = fees[tokenAddress].toHexString();
    });
    return {
      fees: feesHex,
      feeExpiration: configDefaults.transactionFees.feeExpirationInMS,
      feesID: feeCacheID,
      pubkey: this.walletPublicKey,
      encryptedHash: '',
    };
  };

  async broadcastFeesForChain(chainID: NetworkChainID) {
    // Map from tokenAddress to BigNumber hex string
    const { fees, feeCacheID } = getAllUnitTokenFeesForChain(chainID);
    const feeBroadcastData = this.createFeeBroadcastData(fees, feeCacheID);
    this.dbg(`Broadcasting fees for chain ${chainID}: `, fees);
    const contentTopic = contentTopics.fees(chainID);
    const result = await this.publish(feeBroadcastData, contentTopic);
    this.dbg(`Result: ${result}`);
  }

  async broadcastFeesOnInterval() {
    await delay(configDefaults.waku.broadcastFeesDelayInMS);
    const chainIDs = configuredNetworkChainIDs();
    const broadcastPromises: Promise<void>[] = chainIDs.map((chainID) =>
      this.broadcastFeesForChain(chainID),
    );
    await Promise.all(broadcastPromises);
    this.broadcastFeesOnInterval();
  }

  async poll(frequency: number = 5000) {
    const messages = await this.client
      .getMessages(this.topic, this.allContentTopics)
      .catch((e) => {
        this.dbg(e.message);
        return [];
      });
    await Promise.all(messages.map((message) => this.handleMessage(message)));
    await delay(frequency);
    this.poll(frequency);
  }
}
