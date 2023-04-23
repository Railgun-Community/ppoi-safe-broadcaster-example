import { getSharedSecret as getSharedSecretED25519 } from '@noble/ed25519';
import { getRailgunWalletPrivateViewingKey } from '@railgun-community/quickstart';
import debug from 'debug';
import { getRailgunWalletID } from '../../wallets/active-wallets';
import { WakuMethodResponse } from '../waku-response';
import { ErrorMessage } from '../../../util/errors';
import { RelayerChain } from '../../../models/chain-models';
import configNetworks from '../../config/config-networks';
import {
  RelayerEncryptedMethodParams,
  RelayerRawParamsPreAuthorize,
  RelayerSignedPreAuthorization,
} from '@railgun-community/shared-models';
import { preAuthorizeRequest } from '../../paymaster/pre-authorization';
import { tryDecryptData } from '../../../util/encryption';
import {
  encryptedRPCResponse,
  relayerErrorResponse,
} from '../relayer-response';
import { validateRequest } from './validate-request';
import { contentTopics } from '../topics';

const handledClientPubKeys: string[] = [];

const dbg = debug('relayer:pre-authorize');

export const preAuthorizeMethod = async (
  params: RelayerEncryptedMethodParams,
  id: number,
): Promise<Optional<WakuMethodResponse>> => {
  dbg('got a pre-authorize request');
  dbg(params);

  const { pubkey: clientPubKey, encryptedData } = params;

  if (handledClientPubKeys.includes(clientPubKey)) {
    // Client sent a repeated message. Ignore because we've already handled it.
    dbg('Repeat message - already handled');
    return undefined;
  }
  handledClientPubKeys.push(clientPubKey);

  const railgunWalletID = getRailgunWalletID();
  const viewingPrivateKey = getRailgunWalletPrivateViewingKey(railgunWalletID);
  const sharedKey = await getSharedSecretED25519(
    viewingPrivateKey,
    clientPubKey,
  );

  const decrypted = tryDecryptData(encryptedData, sharedKey);
  if (decrypted == null) {
    // Incorrect key. Skipping transact message.
    dbg('Cannot decrypt - Not intended receiver');
    return undefined;
  }

  const {
    chainType,
    chainID,
    gasLimit,
    feesID: feeCacheID,
    commitmentCiphertext,
    commitmentHash,
    relayerViewingKey,
    devLog,
    minVersion,
    maxVersion,
  } = decrypted as RelayerRawParamsPreAuthorize;

  const chain: RelayerChain = {
    type: chainType,
    id: chainID,
  };

  dbg('Decrypted - attempting to transact');

  const responseContentTopic = contentTopics.preAuthorizeResponse(chain);

  try {
    const isValid = validateRequest(
      dbg,
      chain,
      minVersion,
      maxVersion,
      relayerViewingKey,
      feeCacheID,
    );
    if (!isValid) {
      // Do nothing. No error response.
      return;
    }

    // Relayer request validated. Begin error responses.
    if (
      chainType == null ||
      chainID == null ||
      gasLimit == null ||
      commitmentCiphertext == null ||
      commitmentHash == null ||
      feeCacheID == null ||
      relayerViewingKey == null
    ) {
      return relayerErrorResponse(
        id,
        responseContentTopic,
        sharedKey,
        new Error(ErrorMessage.MISSING_REQUIRED_FIELD),
        devLog,
      );
    }
    if (!configNetworks[chain.type] || !configNetworks[chain.type][chain.id]) {
      return relayerErrorResponse(
        id,
        responseContentTopic,
        sharedKey,
        new Error(ErrorMessage.UNSUPPORTED_NETWORK),
        devLog,
      );
    }

    const signedPreAuthorization = await preAuthorizeRequest(
      chain,
      feeCacheID,
      commitmentCiphertext,
      commitmentHash,
      gasLimit,
    );
    return relayerResultResponse(
      id,
      responseContentTopic,
      sharedKey,
      signedPreAuthorization,
    );
  } catch (err) {
    dbg(err);
    return relayerErrorResponse(
      id,
      responseContentTopic,
      sharedKey,
      err,
      devLog,
    );
  }
};

const relayerResultResponse = (
  id: number,
  responseContentTopic: string,
  sharedKey: Uint8Array,
  signedPreAuthorization: RelayerSignedPreAuthorization,
): WakuMethodResponse => {
  dbg('Response:', signedPreAuthorization);
  return encryptedRPCResponse(
    signedPreAuthorization,
    responseContentTopic,
    id,
    sharedKey,
  );
};
