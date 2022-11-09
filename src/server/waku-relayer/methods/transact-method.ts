import * as ed from '@noble/ed25519';
import { TransactionResponse } from '@ethersproject/providers';
import {
  hexlify,
  encryptJSONDataWithSharedKey,
  tryDecryptJSONDataWithSharedKey,
  EncryptedData,
} from '@railgun-community/engine';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';
import { processTransaction } from '../../transactions/process-transaction';
import {
  getRailgunAddressData,
  getRailgunPrivateViewingKey,
} from '../../wallets/active-wallets';
import { contentTopics } from '../topics';
import { WakuMethodResponse } from '../waku-response';
import { ErrorMessage } from '../../../util/errors';
import configDefaults from '../../config/config-defaults';
import { recognizesFeeCacheID } from '../../fees/transaction-fee-cache';
import { RelayerChain } from '../../../models/chain-models';
import configNetworks from '../../config/config-networks';
import {
  RelayerMethodParamsTransact,
  RelayerRawParamsTransact,
} from '@railgun-community/shared-models';
import { getRelayerVersion, versionCompare } from '../../../util/versions';

const handledClientPubKeys: string[] = [];

const dbg = debug('relayer:transact');

export const transactMethod = async (
  params: RelayerMethodParamsTransact,
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
  if (decrypted == null) {
    // Incorrect key. Skipping transact message.
    dbg('Cannot decrypt - Not intended receiver');
    return undefined;
  }

  const {
    chainType,
    chainID,
    minGasPrice,
    feesID: feeCacheID,
    serializedTransaction,
    relayerViewingKey,
    useRelayAdapt,
    devLog,
    minVersion,
    maxVersion,
  } = decrypted as RelayerRawParamsTransact;

  const chain: RelayerChain = {
    type: chainType,
    id: chainID,
  };

  if (
    chainType == null ||
    chainID == null ||
    minGasPrice == null ||
    feeCacheID == null ||
    serializedTransaction == null ||
    relayerViewingKey == null ||
    useRelayAdapt == null ||
    minVersion == null ||
    maxVersion == null
  ) {
    return errorResponse(
      id,
      chain,
      sharedKey,
      new Error(ErrorMessage.MISSING_REQUIRED_FIELD),
      devLog,
    );
  }

  try {
    dbg('Decrypted - attempting to transact');

    if (!minVersion || !maxVersion) {
      dbg(`Cannot process tx - Requires params minVersion, maxVersion`);
      return;
    }
    const relayerVersion = getRelayerVersion();
    if (
      versionCompare(relayerVersion, minVersion) < 0 ||
      versionCompare(relayerVersion, maxVersion) > 0
    ) {
      dbg(
        `Cannot process tx - Relayer version ${relayerVersion} outside range ${minVersion}-${maxVersion}`,
      );
      return;
    }

    if (!configNetworks[chain.type] || !configNetworks[chain.type][chain.id]) {
      return errorResponse(
        id,
        chain,
        sharedKey,
        new Error(ErrorMessage.UNSUPPORTED_NETWORK),
        devLog,
      );
    }

    const { viewingPublicKey } = getRailgunAddressData();
    if (relayerViewingKey !== hexlify(viewingPublicKey)) {
      return undefined;
    }

    if (
      configDefaults.transactionFees.requireMatchingFeeCacheID &&
      !recognizesFeeCacheID(chain, feeCacheID)
    ) {
      dbg(
        'Fee cache ID unrecognized. Transaction sent to another Relayer with same Rail Address.',
      );
      return undefined;
    }

    const txResponse = await processTransaction(
      chain,
      feeCacheID,
      minGasPrice,
      serializedTransaction,
      useRelayAdapt ?? false,
      devLog,
    );
    return resultResponse(id, chain, sharedKey, txResponse);
  } catch (err: any) {
    dbg(err);
    return errorResponse(id, chain, sharedKey, err, devLog);
  }
};

const resultResponse = (
  id: number,
  chain: RelayerChain,
  sharedKey: Uint8Array,
  txResponse: TransactionResponse,
): WakuMethodResponse => {
  const response = { txHash: txResponse.hash };
  return encryptedRPCResponse(response, id, chain, sharedKey);
};

const replaceErrorMessageNonDev = (
  errMsg: string,
  devLog?: boolean,
): string => {
  if (devLog) {
    return errMsg;
  }
  switch (errMsg) {
    case ErrorMessage.BAD_TOKEN_FEE:
    case 'No Relayer payment included in transaction.':
      return ErrorMessage.BAD_TOKEN_FEE;
    case ErrorMessage.GAS_ESTIMATE_ERROR:
      return ErrorMessage.GAS_ESTIMATE_ERROR;
    case ErrorMessage.TRANSACTION_SEND_TIMEOUT_ERROR:
      return ErrorMessage.TRANSACTION_SEND_TIMEOUT_ERROR;
    case ErrorMessage.UNSUPPORTED_NETWORK:
      return ErrorMessage.UNSUPPORTED_NETWORK;
  }
  return ErrorMessage.UNKNOWN_ERROR;
};

const errorResponse = (
  id: number,
  chain: RelayerChain,
  sharedKey: Uint8Array,
  err: Error,
  devLog?: boolean,
): WakuMethodResponse => {
  const response = {
    error: replaceErrorMessageNonDev(err.message, devLog),
  };
  return encryptedRPCResponse(response, id, chain, sharedKey);
};

const encryptedRPCResponse = (
  response: object,
  id: number,
  chain: RelayerChain,
  sharedKey: Uint8Array,
) => {
  dbg('Response:', response);
  const encryptedResponse = encryptResponseData(response, sharedKey);
  const rpcResult = formatJsonRpcResult(id, encryptedResponse);
  return {
    rpcResult,
    contentTopic: contentTopics.transactResponse(chain),
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
