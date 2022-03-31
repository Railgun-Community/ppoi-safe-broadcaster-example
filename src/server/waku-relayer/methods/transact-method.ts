import { TransactionResponse } from '@ethersproject/providers';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';
import { NetworkChainID } from '../../config/config-chain-ids';
import { processTransaction } from '../../transactions/process-transaction';
import { getRailgunWalletPubKey } from '../../wallets/active-wallets';
import { contentTopics } from '../topics';
import { WakuMethodResponse } from '../waku-response';

export type WakuMethodParamsTransact = {
  serializedTransaction: string;
  pubkey: string;
  chainID: NetworkChainID;
  feesID: string;
};

export const transactMethod = async (
  params: WakuMethodParamsTransact,
  id: number,
  logger: debug.Debugger,
): Promise<Optional<WakuMethodResponse>> => {
  const { chainID, feesID: feeCacheID, serializedTransaction, pubkey } = params;

  const railgunWalletPubKey = getRailgunWalletPubKey();
  if (railgunWalletPubKey !== pubkey) {
    return undefined;
  }

  // TODO: Remove these for production release.
  if (serializedTransaction === 'demo-result') {
    return resultResponse(id, chainID, {
      hash: '12345',
    } as TransactionResponse);
  }
  if (serializedTransaction === 'demo-error') {
    return errorResponse(id, chainID, new Error('Bad token fee.'));
  }

  try {
    const txResponse = await processTransaction(
      chainID,
      feeCacheID,
      serializedTransaction,
    );
    logger('txResponse');
    logger(txResponse);

    return resultResponse(id, chainID, txResponse);
  } catch (err: any) {
    logger(err);
    return errorResponse(id, chainID, err);
  }
};

const resultResponse = (
  id: number,
  chainID: NetworkChainID,
  txResponse: TransactionResponse,
): WakuMethodResponse => {
  const rpcResult = formatJsonRpcResult(
    id,
    JSON.stringify({
      txHash: txResponse.hash,
    }),
  );
  return {
    rpcResult,
    contentTopic: contentTopics.transactResponse(chainID),
  };
};

const errorResponse = (
  id: number,
  chainID: NetworkChainID,
  err: Error,
): WakuMethodResponse => {
  let sanitizedErrorMessage: string;
  switch (err.message) {
    case 'Bad token fee.':
      sanitizedErrorMessage = err.message;
      break;
    default:
      sanitizedErrorMessage = 'Unknown error.';
      break;
  }
  const rpcResult = formatJsonRpcResult(
    id,
    JSON.stringify({
      result: {
        error: sanitizedErrorMessage,
      },
    }),
  );
  return {
    rpcResult,
    contentTopic: contentTopics.transactResponse(chainID),
  };
};
