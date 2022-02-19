import { JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';
import { processTransaction } from '../../transactions/process-transaction';
import { getRailgunWalletPubKey } from '../../wallets/active-wallets';

export const transactMethod = async (
  params: any,
  id: number,
  logger: debug.Debugger,
): Promise<Optional<JsonRpcResult<string>>> => {
  const { chainID, feeID, serializedTransaction, pubkey } = params;
  const railgunWalletPubKey = getRailgunWalletPubKey();
  if (railgunWalletPubKey !== pubkey) {
    return undefined;
  }
  try {
    const txResponse = await processTransaction(
      chainID,
      feeID,
      serializedTransaction,
    );
    logger('txResponse');
    logger(txResponse);
    return formatJsonRpcResult(
      id,
      JSON.stringify({
        type: 'txResponse.hash',
        hash: txResponse.hash,
      }),
    );
  } catch (err: any) {
    logger(err);
    return formatJsonRpcResult(id, err.message);
  }
};
