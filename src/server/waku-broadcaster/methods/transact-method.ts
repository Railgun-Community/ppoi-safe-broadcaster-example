import * as ed from '@noble/ed25519';
import {
  ByteUtils,
  encryptJSONDataWithSharedKey,
  tryDecryptJSONDataWithSharedKey,
  EncryptedData,
  getRailgunWalletPrivateViewingKey,
  getRailgunWalletAddressData,
} from '@railgun-community/wallet';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';
import { processTransaction } from '../../transactions/process-transaction';
import {
  getRailgunWalletAddress,
  getRailgunWalletID,
} from '../../wallets/active-wallets';
import { contentTopics } from '../topics';
import { WakuMethodResponse } from '../waku-response';
import {
  ErrorMessage,
  sanitizeCustomBroadcasterError,
} from '../../../util/errors';
import configDefaults from '../../config/config-defaults';
import { recognizesFeeCacheID } from '../../fees/transaction-fee-cache';
import { BroadcasterChain } from '../../../models/chain-models';
import configNetworks from '../../config/config-networks';
import {
  BroadcasterEncryptedMethodParams,
  BroadcasterRawParamsTransact,
  TXIDVersion,
  isDefined,
  versionCompare,
} from '@railgun-community/shared-models';
import { getBroadcasterVersion } from '../../../util/broadcaster-version';
import { TransactionResponse, formatUnits, parseUnits } from 'ethers';
import { createValidTransaction } from '../../transactions/transaction-validator';
import {
  ReliabilityMetric,
  incrementReliability,
} from '../../../util/reliability';

import {
  isHandledClientPubKey,
  storeHandledClientKey,
} from '../../../util/handled-keys';

const dbg = debug('broadcaster:transact');

const sanitizeSuggestedFee = (errorString: string) => {
  const pattern = /Suggested Gas Price was (\d+\.\d+)/;

  const match = errorString.match(pattern);
  if (isDefined(match)) {
    const suggestedFee = match[1];
    return suggestedFee;
  }
  dbg('No Sanitized Suggestion Found');
  return undefined;
};

export const transactMethod = async (
  params: BroadcasterEncryptedMethodParams,
  id: number,
  incomingChain: BroadcasterChain,
): Promise<Optional<WakuMethodResponse>> => {
  dbg('got transact');
  dbg(params);

  const { pubkey: clientPubKey, encryptedData } = params;

  if (isHandledClientPubKey(clientPubKey)) {
    // Client sent a repeated message. Ignore because we've already handled it.
    dbg('Repeat message - already handled');
    return undefined;
  }
  await storeHandledClientKey(clientPubKey);
  await incrementReliability(
    {
      // @ts-ignore; this is a dummy chain object since we don't have the chain info yet
      id: 0,
      type: 0,
    },
    ReliabilityMetric.TOTAL_SEEN,
  );

  const railgunWalletID = getRailgunWalletID();
  const viewingPrivateKey = getRailgunWalletPrivateViewingKey(railgunWalletID);
  const sharedKey = await ed.getSharedSecret(viewingPrivateKey, clientPubKey);

  const decrypted = (await tryDecryptData(
    encryptedData,
    sharedKey,
  )) as BroadcasterRawParamsTransact;
  if (decrypted == null) {
    // Incorrect key. Skipping transact message.
    dbg('Cannot decrypt - Not intended receiver');
    await incrementReliability(incomingChain, ReliabilityMetric.DECODE_FAILURE);
    return undefined;
  }

  const {
    chainType,
    chainID,
    minGasPrice,
    feesID: feeCacheID,
    to,
    data,
    broadcasterViewingKey,
    useRelayAdapt,
    devLog,
    minVersion,
    maxVersion,
  } = decrypted;

  const txidVersion = decrypted.txidVersion ?? TXIDVersion.V2_PoseidonMerkle;
  const preTransactionPOIsPerTxidLeafPerList =
    decrypted.preTransactionPOIsPerTxidLeafPerList ?? {};

  const chain: BroadcasterChain = {
    type: chainType,
    id: chainID,
  };

  if (incomingChain.type !== chainType && incomingChain.id !== chainID) {
    dbg(
      `Incoming Chain mismatch! Expected ${chainType}:${chain.id} got ${incomingChain.type}:${incomingChain.id}`,
    );
  }
  await incrementReliability(chain, ReliabilityMetric.DECODE_SUCCESS);

  try {
    dbg('Decrypted - attempting to transact');

    if (!minVersion || !maxVersion) {
      dbg(`Cannot process tx - Requires params minVersion, maxVersion`);
      // Do nothing. No error response.
      await incrementReliability(chain, ReliabilityMetric.BAD_DATA);
      return undefined;
    }
    const broadcasterVersion = getBroadcasterVersion();
    if (
      versionCompare(broadcasterVersion, minVersion) < 0 ||
      versionCompare(broadcasterVersion, maxVersion) > 0
    ) {
      dbg(
        `Cannot process tx - Broadcaster version ${broadcasterVersion} outside range ${minVersion}-${maxVersion}`,
      );
      // Do nothing. No error response.
      await incrementReliability(chain, ReliabilityMetric.BAD_DATA);
      return undefined;
    }

    if (!broadcasterViewingKey) {
      dbg(`Cannot process tx - Requires params broadcasterViewingKey`);
      // Do nothing. No error response.
      await incrementReliability(chain, ReliabilityMetric.BAD_DATA);
      return undefined;
    }

    const railgunWalletAddress = getRailgunWalletAddress();
    const { viewingPublicKey } =
      getRailgunWalletAddressData(railgunWalletAddress);
    if (broadcasterViewingKey !== ByteUtils.hexlify(viewingPublicKey)) {
      await incrementReliability(chain, ReliabilityMetric.BAD_DATA);
      return undefined;
    }

    if (!feeCacheID) {
      dbg(`Cannot process tx - Requires params feeCacheID`);
      // Do nothing. No error response.
      await incrementReliability(chain, ReliabilityMetric.BAD_DATA);
      return undefined;
    }
    if (
      configDefaults.transactionFees.requireMatchingFeeCacheID &&
      !recognizesFeeCacheID(chain, feeCacheID)
    ) {
      dbg(
        'Fee cache ID unrecognized. Transaction sent to another Broadcaster with same Rail Address.',
      );
      // Do nothing. No error response.
      await incrementReliability(chain, ReliabilityMetric.BAD_DATA);
      return undefined;
    }

    // Broadcaster validated. Begin error responses.

    if (
      chainType == null ||
      chainID == null ||
      minGasPrice == null ||
      feeCacheID == null ||
      to == null ||
      data == null ||
      broadcasterViewingKey == null ||
      useRelayAdapt == null
    ) {
      await incrementReliability(chain, ReliabilityMetric.BAD_DATA);

      return errorResponse(
        id,
        chain,
        sharedKey,
        new Error(ErrorMessage.MISSING_REQUIRED_FIELD),
        devLog,
      );
    }

    if (
      !isDefined(configNetworks[chain.type]) ||
      !isDefined(configNetworks[chain.type][chain.id])
    ) {
      await incrementReliability(chain, ReliabilityMetric.BAD_DATA);

      return errorResponse(
        id,
        chain,
        sharedKey,
        new Error(ErrorMessage.UNSUPPORTED_NETWORK),
        devLog,
      );
    }

    const transaction = createValidTransaction(chain, to, data, 0n);

    const txResponse = await processTransaction(
      txidVersion,
      chain,
      feeCacheID,
      BigInt(minGasPrice),
      transaction,
      useRelayAdapt ?? false,
      preTransactionPOIsPerTxidLeafPerList,
      devLog,
    );
    await incrementReliability(chain, ReliabilityMetric.SEND_SUCCESS);

    return resultResponse(id, chain, sharedKey, txResponse);
  } catch (err) {
    // custom error message
    if (err.message.indexOf('CMsg_') !== -1) {
      // strip the custom message. CM
      const errReceived = sanitizeCustomBroadcasterError(err);
      dbg(errReceived);
      const newErrorString = err.message.slice(5);
      const suggestedFee = sanitizeSuggestedFee(newErrorString);
      dbg('Suggested Fee', suggestedFee);

      if (isDefined(suggestedFee)) {
        dbg('Suggested Fee Found');
        // check if the fee is within X gwei of the min. if it is. try again.
        // additionallly, store original error, to then pass if we error again.

        const minGasPriceBN = BigInt(minGasPrice);
        const suggestedFeeBN = parseUnits(suggestedFee, 'gwei');

        const { retryGasBuffer } = configNetworks[chain.type][chain.id];
        const inflatedMaxGasPrice = minGasPriceBN + retryGasBuffer;

        const minDifference = parseUnits('0.01', 'gwei');

        const suggestedDifferenceBN = suggestedFeeBN - minGasPriceBN;

        const constrainedDifference =
          minDifference > suggestedDifferenceBN
            ? minDifference
            : suggestedDifferenceBN;

        const inflatedDifferenceBN = (constrainedDifference * 12000n) / 10000n;

        const inflatedSuggestedFeeBN = minGasPriceBN + inflatedDifferenceBN;

        const formattedInflatedSuggestion = parseFloat(
          formatUnits(inflatedSuggestedFeeBN, 'gwei'),
        ).toFixed(8);

        const formattedInflatedSuggestionBN = parseUnits(
          formattedInflatedSuggestion,
          'gwei',
        );

        if (inflatedSuggestedFeeBN < inflatedMaxGasPrice) {
          const firstErrorResponse = new Error(newErrorString);
          try {
            dbg(
              `LOW FEE DETECTED: Retrying Transaction with minGasPrice: ${formattedInflatedSuggestion}`,
            );
            const transaction = createValidTransaction(chain, to, data, 0n);
            const txResponse = await processTransaction(
              txidVersion,
              chain,
              feeCacheID,
              formattedInflatedSuggestionBN,
              transaction,
              useRelayAdapt ?? false,
              preTransactionPOIsPerTxidLeafPerList,
              devLog,
            );
            await incrementReliability(chain, ReliabilityMetric.SEND_SUCCESS);

            return resultResponse(id, chain, sharedKey, txResponse);
          } catch (err) {
            // any error here. we just return original response instead.
            dbg('We Errored twice.', err);
            await incrementReliability(chain, ReliabilityMetric.SEND_FAILURE);

            return errorResponse(
              id,
              chain,
              sharedKey,
              firstErrorResponse,
              true,
            );
          }
        }
      }
      const newErr = new Error(newErrorString);
      await incrementReliability(chain, ReliabilityMetric.SEND_FAILURE);

      return errorResponse(id, chain, sharedKey, newErr, true);
    }
    dbg(err);
    await incrementReliability(chain, ReliabilityMetric.SEND_FAILURE);

    return errorResponse(id, chain, sharedKey, err, devLog);
  }
};

const resultResponse = (
  id: number,
  chain: BroadcasterChain,
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
  if (devLog ?? false) {
    return errMsg;
  }
  const knownError = errMsg as ErrorMessage;
  switch (knownError) {
    case ErrorMessage.TRANSACTION_UNDERPRICED:
    case ErrorMessage.BAD_TOKEN_FEE:
    case ErrorMessage.NO_BROADCASTER_FEE:
    case ErrorMessage.GAS_ESTIMATE_ERROR:
    case ErrorMessage.GAS_ESTIMATE_REVERT:
    case ErrorMessage.TRANSACTION_SEND_TIMEOUT_ERROR:
    case ErrorMessage.TRANSACTION_SEND_RPC_ERROR:
    case ErrorMessage.UNSUPPORTED_NETWORK:
    case ErrorMessage.GAS_PRICE_TOO_LOW:
    case ErrorMessage.MISSING_REQUIRED_FIELD:
    case ErrorMessage.FAILED_QUORUM:
    case ErrorMessage.REJECTED_PACKAGED_FEE:
    case ErrorMessage.FAILED_TO_EXTRACT_PACKAGED_FEE:
    case ErrorMessage.REPEAT_TRANSACTION:
    case ErrorMessage.BROADCASTER_OUT_OF_GAS:
    case ErrorMessage.NOTE_ALREADY_SPENT:
    case ErrorMessage.UNKNOWN_ERROR:
    case ErrorMessage.POI_INVALID:
    case ErrorMessage.NONCE_ALREADY_USED:
    case ErrorMessage.BAD_RESPONSE:
    case ErrorMessage.MISSING_RESPONSE:
      return errMsg;
  }
  return ErrorMessage.UNKNOWN_ERROR;
};

const errorResponse = (
  id: number,
  chain: BroadcasterChain,
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
  chain: BroadcasterChain,
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
