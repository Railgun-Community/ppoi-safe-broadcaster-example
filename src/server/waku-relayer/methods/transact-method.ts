import * as ed from '@noble/ed25519';
import { TransactionResponse } from '@ethersproject/providers';
import { hexlify } from '@railgun-community/lepton/dist/utils/bytes';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';
import { EncryptedData } from '@railgun-community/lepton/dist/models/transaction-types';
import {
  encryptJSONDataWithSharedKey,
  tryDecryptJSONDataWithSharedKey,
} from '@railgun-community/lepton/dist/utils/ecies';
import { NetworkChainID } from '../../config/config-chain-ids';
import { processTransaction } from '../../transactions/process-transaction';
import {
  getRailgunAddressData,
  getRailgunPrivateViewingKey,
} from '../../wallets/active-wallets';
import { contentTopics } from '../topics';
import { WakuMethodResponse } from '../waku-response';

export type WakuMethodParamsTransact = {
  pubkey: string;
  encryptedData: [string, string];
};

export type RawParamsTransact = {
  serializedTransaction: string;
  chainID: number;
  feesID: string;
  relayerViewingKey: string;
};

const handledClientPubKeys: string[] = [];

const dbg = debug('relayer:waku:transact');

export const transactMethod = async (
  params: WakuMethodParamsTransact,
  id: number,
): Promise<Optional<WakuMethodResponse>> => {
  const { pubkey: clientPubKey, encryptedData } = params;

  if (handledClientPubKeys.includes(clientPubKey)) {
    // Client sent a repeated message. Ignore because we've already handled it.
    dbg('Repeat message - already handled');
    return undefined;
  }
  handledClientPubKeys.push(clientPubKey);

  const viewingPrivateKey = getRailgunPrivateViewingKey();
  const sharedKey = await ed.getSharedSecret(viewingPrivateKey, clientPubKey);

  const decrypted = await tryDecryptData(encryptedData, sharedKey);
  if (decrypted === null) {
    // Incorrect key. Skipping transact message.
    dbg('Cannot decrypt - Not intended receiver');
    return undefined;
  }

  const {
    chainID,
    feesID: feeCacheID,
    serializedTransaction,
    relayerViewingKey,
  } = decrypted as RawParamsTransact;

  dbg('Decrypted - attempting to transact');

  const { viewingPublicKey } = getRailgunAddressData();
  if (relayerViewingKey !== hexlify(viewingPublicKey)) {
    return undefined;
  }

  try {
    const txResponse = await processTransaction(
      chainID,
      feeCacheID,
      serializedTransaction,
    );
    dbg(txResponse);
    return resultResponse(id, chainID, sharedKey, txResponse);
  } catch (err: any) {
    dbg(err);
    return errorResponse(id, chainID, sharedKey, err);
  }
};

const resultResponse = (
  id: number,
  chainID: NetworkChainID,
  sharedKey: Uint8Array,
  txResponse: TransactionResponse,
): WakuMethodResponse => {
  const encryptedResponse = encryptResponseData(
    { txHash: txResponse.hash },
    sharedKey,
  );
  const rpcResult = formatJsonRpcResult(id, encryptedResponse);
  return {
    rpcResult,
    contentTopic: contentTopics.transactResponse(chainID),
  };
};

const errorResponse = (
  id: number,
  chainID: NetworkChainID,
  sharedKey: Uint8Array,
  err: Error,
): WakuMethodResponse => {
  let sanitizedErrorMessage: string;
  switch (err.message) {
    case 'No Relayer payment included in transaction.':
    case 'Bad token fee.':
      sanitizedErrorMessage = 'Bad token fee.';
      break;
    default:
      sanitizedErrorMessage = 'Unknown Relayer error.';
      break;
  }
  const encryptedResponse = encryptResponseData(
    {
      error: sanitizedErrorMessage,
    },
    sharedKey,
  );
  const rpcResult = formatJsonRpcResult(id, encryptedResponse);
  return {
    rpcResult,
    contentTopic: contentTopics.transactResponse(chainID),
  };
};

export const tryDecryptData = async (
  encryptedData: EncryptedData,
  sharedKey: Uint8Array,
  // eslint-disable-next-line require-await
): Promise<object | null> => {
  return tryDecryptJSONDataWithSharedKey(encryptedData, sharedKey);
};

export const encryptResponseData = (
  data: object,
  sharedKey: Uint8Array,
): EncryptedData => {
  return encryptJSONDataWithSharedKey(data, sharedKey);
};
