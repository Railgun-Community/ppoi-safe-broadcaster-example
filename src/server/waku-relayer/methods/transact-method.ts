import { JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';
import { processTransaction } from '../../transactions/process-transaction';

export const transactMethod = async (
  params: any,
  id: number,
  logger: debug.Debugger,
): Promise<JsonRpcResult<string>> => {
  const { chainID, serializedTransaction } = params;
  try {
    const txResponse = await processTransaction(chainID, serializedTransaction);
    logger('txResponse');
    logger(txResponse);
    return formatJsonRpcResult(id, JSON.stringify(txResponse));
  } catch (err: any) {
    logger(err);
    return formatJsonRpcResult(id, err.message);
  }
};
