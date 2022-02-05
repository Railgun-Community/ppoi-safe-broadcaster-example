import { JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';
import { processTransaction } from '../../transactions/process-transaction';

export const transactMethod = async (
  params: any,
  id: number,
  _logger: debug.Debugger,
): Promise<JsonRpcResult<string>> => {
  const { chainID, serializedTransaction } = params;
  const txResponse = await processTransaction(chainID, serializedTransaction);
  return formatJsonRpcResult(id, JSON.stringify(txResponse));
};
