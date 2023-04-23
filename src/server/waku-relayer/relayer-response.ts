import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import { encryptResponseData } from '../../util/encryption';
import { ErrorMessage } from '../../util/errors';
import { WakuMethodResponse } from './waku-response';

const replaceErrorMessageNonDev = (
  errMsg: string,
  devLog?: boolean,
): string => {
  if (devLog) {
    return errMsg;
  }
  const knownError = errMsg as ErrorMessage;
  switch (knownError) {
    case ErrorMessage.BAD_TOKEN_FEE:
    case ErrorMessage.NO_RELAYER_FEE:
    case ErrorMessage.GAS_ESTIMATE_ERROR:
    case ErrorMessage.TRANSACTION_SEND_TIMEOUT_ERROR:
    case ErrorMessage.UNSUPPORTED_NETWORK:
    case ErrorMessage.GAS_PRICE_TOO_LOW:
    case ErrorMessage.MISSING_REQUIRED_FIELD:
    case ErrorMessage.UNKNOWN_ERROR:
    case ErrorMessage.NOT_ENOUGH_PAYMASTER_GAS:
      return errMsg;
  }
  return ErrorMessage.UNKNOWN_ERROR;
};

export const relayerErrorResponse = (
  id: number,
  responseContentTopic: string,
  sharedKey: Uint8Array,
  err: Error,
  devLog?: boolean,
): WakuMethodResponse => {
  const response = {
    error: replaceErrorMessageNonDev(err.message, devLog),
  };
  return encryptedRPCResponse(response, responseContentTopic, id, sharedKey);
};

export const encryptedRPCResponse = (
  response: object,
  responseContentTopic: string,
  id: number,
  sharedKey: Uint8Array,
) => {
  const encryptedResponse = encryptResponseData(response, sharedKey);
  const rpcResult = formatJsonRpcResult(id, encryptedResponse);
  return {
    rpcResult,
    contentTopic: responseContentTopic,
  };
};
