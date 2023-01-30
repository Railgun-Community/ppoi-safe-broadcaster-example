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
import { RelayerChain } from '../../models/chain-models';
import {
  RelayerFeeMessage,
  RelayerFeeMessageData,
} from '@railgun-community/shared-models';
import { getRelayerVersion } from '../../util/relayer-version';
import configDefaults from '../config/config-defaults';

export const WAKU_TOPIC = '/waku/2/default-waku/proto';

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

  walletRailgunAddress: string;

  identifier: Optional<string> = configDefaults.instanceIdentifier.length
    ? configDefaults.instanceIdentifier
    : undefined;

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
    this.walletRailgunAddress = wallet.getAddress();
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
  ): Promise<void> {
    if (!payload) {
      return;
    }
    const msg = WakuMessage.fromUtf8String(
      JSON.stringify(payload),
      contentTopic,
    );
    return this.client.publish(msg, WAKU_TOPIC).catch((e) => {
      this.dbg('Error publishing message', e.message);
    });
  }

  static decode(payload: Uint8Array): string {
    return Buffer.from(payload).toString('utf8');
  }

  async handleMessage(message: WakuRelayMessage): Promise<void> {
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

  private createFeeBroadcastData = async (
    fees: MapType<BigNumber>,
    feeCacheID: string,
    chain: RelayerChain,
  ): Promise<RelayerFeeMessage> => {
    const tokenAddresses = Object.keys(fees);
    const feesHex: MapType<string> = {};
    tokenAddresses.forEach((tokenAddress) => {
      feesHex[tokenAddress] = fees[tokenAddress].toHexString();
    });

    // Availability must be accurate or Relayer risks automatic blocking by clients.
    const availableWallets = await numAvailableWallets(chain);

    const data: RelayerFeeMessageData = {
      fees: feesHex,
      // client can't rely on message timestamp to calculate expiration
      feeExpiration: Date.now() + this.options.feeExpiration,
      feesID: feeCacheID,
      railgunAddress: this.walletRailgunAddress,
      identifier: this.identifier,
      availableWallets,
      version: getRelayerVersion(),
      relayAdapt: configNetworks[chain.type][chain.id].relayAdaptContract,
    };
    const message = fromUTF8String(JSON.stringify(data));
    const signature = hexlify(
      await this.wallet.signWithViewingKey(hexStringToBytes(message)),
    );
    this.dbg(
      `Broadcasting fees for chain ${chain.type}:${chain.id}: Tokens ${
        Object.keys(fees).length
      }, Available Wallets ${availableWallets}`,
    );
    return {
      data: message,
      signature,
    };
  };

  async broadcastFeesForChain(chain: RelayerChain): Promise<void> {
    // Map from tokenAddress to BigNumber hex string
    const { fees, feeCacheID } = getAllUnitTokenFeesForChain(chain);
    const feeBroadcastData = await this.createFeeBroadcastData(
      fees,
      feeCacheID,
      chain,
    );
    const contentTopic = contentTopics.fees(chain);
    return this.publish(feeBroadcastData, contentTopic);
  }

  async broadcastFeesOnInterval(interval: number): Promise<void> {
    if (this.stopping) return;
    const chains = configuredNetworkChains();
    const broadcastPromises: Promise<void>[] = chains.map((chain) =>
      this.broadcastFeesForChain(chain),
    );

    await Promise.all(broadcastPromises);
    await delay(interval);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.broadcastFeesOnInterval(interval);
  }

  async poll(frequency: number): Promise<void> {
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

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.poll(frequency);
  }
}
