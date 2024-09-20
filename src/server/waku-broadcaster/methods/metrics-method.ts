import * as ed from '@noble/ed25519';
import type { BroadcasterChain } from '../../../models/chain-models';
import type { WakuMethodResponse } from '../waku-response';
import { contentTopics } from '../topics';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import {
  isDefined,
  type BroadcasterEncryptedMethodParams,
} from '@railgun-community/shared-models';
import debug from 'debug';
import {
  isHandledClientPubKey,
  storeHandledClientKey,
} from '../../../util/handled-keys';
import { getRailgunWalletID } from '../../wallets/active-wallets';
import { getRailgunWalletPrivateViewingKey } from '@railgun-community/wallet';
import { encryptResponseData, tryDecryptData } from './transact-method';

const dbg = debug('broadcaster:metrics');

export const METRICS_TOPIC = '/metrics/ping/json';
export const METRICS_RESPONSE_TOPIC = '/metrics/pong/json';

type MetricsMethodParams = {
  timestamp: number;
};

type MetricsMethodResponse = {
  recvTimestamp: number;
  timeDifference: number;
  sendTimestamp: number;
};

export const metricsMethod = async (
  params: BroadcasterEncryptedMethodParams,
  id: number,
  incomingChain: BroadcasterChain,
): Promise<Optional<WakuMethodResponse>> => {
  // incoming message params
  const now = Date.now();
  const { pubkey: clientPubKey, encryptedData } = params;

  if (isHandledClientPubKey(clientPubKey)) {
    dbg('Repeat message - already handled');
    return undefined;
  }
  await storeHandledClientKey(clientPubKey);

  const railgunWalletID = getRailgunWalletID();
  const viewingPrivateKey = getRailgunWalletPrivateViewingKey(railgunWalletID);
  const sharedKey = await ed.getSharedSecret(viewingPrivateKey, clientPubKey);

  const decrypted = (await tryDecryptData(
    encryptedData,
    sharedKey,
  )) as MetricsMethodParams;

  if (decrypted == null) {
    dbg('Cannot decrypt metric - Not intended receiver');
    return undefined;
  }

  const { timestamp } = decrypted;

  if (!isDefined(timestamp)) {
    dbg('Missing timestamp in metrics method');
    return undefined;
  }

  const timeDifference = now - timestamp;
  const result: MetricsMethodResponse = {
    recvTimestamp: now,
    timeDifference,
    sendTimestamp: Date.now(),
  };

  const encryptedResponse = encryptResponseData(result, sharedKey);
  const rpcResult = formatJsonRpcResult(id, encryptedResponse);

  return {
    rpcResult,
    contentTopic: contentTopics.encrypted(METRICS_RESPONSE_TOPIC),
  };
};
