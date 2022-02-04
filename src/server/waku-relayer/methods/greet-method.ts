import { JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';

export const greetMethod = async (
  params: any,
  id: number,
  logger: debug.Debugger,
): Promise<JsonRpcResult<string>> => {
  const result = `hello ${params.name}`;
  const response = formatJsonRpcResult(id, result);
  logger('responding to request greet', response);
  return response;
};
