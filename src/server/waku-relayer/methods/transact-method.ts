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
    console.log('txResponse');
    console.log(txResponse);
    return formatJsonRpcResult(id, JSON.stringify(txResponse));
  } catch (err: any) {
    console.error(err);
    if (logger.log) {
      logger.log(err);
    }
    return formatJsonRpcResult(id, err.message);
  }
};
