// import * as ed from '@noble/ed25519';
import { TransactionResponse } from '@ethersproject/providers';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';
import { NetworkChainID } from '../../config/config-chain-ids';
import { processTransaction } from '../../transactions/process-transaction';
import { getRailgunWalletKeypair } from '../../wallets/active-wallets';
import { contentTopics } from '../topics';
import { WakuMethodResponse } from '../waku-response';

export type WakuMethodParamsTransact = {
  pubkey: string;
  encryptedData: string;
};

export type RawParamsTransact = {
  serializedTransaction: string;
  chainID: number;
  feesID: string;
  responseKey: string;
};

const handledClientPubKeys: string[] = [];

export const transactMethod = async (
  params: WakuMethodParamsTransact,
  id: number,
  logger: debug.Debugger,
): Promise<Optional<WakuMethodResponse>> => {
  const { pubkey: clientPubKey, encryptedData } = params;

  const decrypted = tryDecryptData(encryptedData, clientPubKey);
  if (decrypted === null) {
    // Incorrect key. Skipping transact message.
    return undefined;
  }

  if (handledClientPubKeys.includes(clientPubKey)) {
    // Client sent a repeated message. Ignore because we've already handled it.
    return undefined;
  }
  handledClientPubKeys.push(clientPubKey);

  const {
    chainID,
    feesID: feeCacheID,
    serializedTransaction,
    responseKey,
  } = decrypted as RawParamsTransact;

  // TODO: Remove these for production release.
  if (serializedTransaction === 'demo-result') {
    return resultResponse(id, chainID, responseKey, {
      hash: '12345',
    } as TransactionResponse);
  }
  if (serializedTransaction === 'demo-error') {
    return errorResponse(id, chainID, responseKey, new Error('Bad token fee.'));
  }

  try {
    const txResponse = await processTransaction(
      chainID,
      feeCacheID,
      serializedTransaction,
    );
    logger('txResponse');
    logger(txResponse);

    return resultResponse(id, chainID, responseKey, txResponse);
  } catch (err: any) {
    logger(err);
    return errorResponse(id, chainID, responseKey, err);
  }
};

const tryDecryptData = (encryptedData: string, clientPubKey: string) => {
  const chainID = 0;
  const railgunWalletPrivKey = getRailgunWalletKeypair(chainID).privateKey;

  try {
    // TODO: Add AES GCM decryption when implemented in Lepton.
    // const sharedKey = ed.curve25519.scalarMult(
    //   railgunWalletPrivKey,
    //   clientPubKey,
    // );
    //
    // const data = aes.gcm.256.decrypt(encryptedData, sharedKey);
    const data = JSON.parse(encryptedData);

    return data;
  } catch (err) {
    // Data is not addressed to Relayer.
    return null;
  }
};

const resultResponse = (
  id: number,
  chainID: NetworkChainID,
  responseKey: string,
  txResponse: TransactionResponse,
): WakuMethodResponse => {
  const encryptedResponse = encryptResponseData(
    { txHash: txResponse.hash },
    responseKey,
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
  responseKey: string,
  err: Error,
): WakuMethodResponse => {
  let sanitizedErrorMessage: string;
  switch (err.message) {
    case 'No Relayer payment included in transaction.':
    case 'Bad token fee.':
      sanitizedErrorMessage = 'Bad token fee.';
      break;
    default:
      sanitizedErrorMessage = 'Unknown error.';
      break;
  }
  const encryptedResponse = encryptResponseData(
    {
      error: sanitizedErrorMessage,
    },
    responseKey,
  );
  const rpcResult = formatJsonRpcResult(id, encryptedResponse);
  return {
    rpcResult,
    contentTopic: contentTopics.transactResponse(chainID),
  };
};

const encryptResponseData = (data: object, responseKey: string): string => {
  // TODO: Add AES GCM encryption when implemented in Lepton.
  return JSON.stringify(data);
};
