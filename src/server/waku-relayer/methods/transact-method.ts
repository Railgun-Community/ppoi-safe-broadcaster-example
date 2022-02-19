import { JsonRpcResult } from '@walletconnect/jsonrpc-types';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';
import debug from 'debug';
import { NetworkChainID } from '../../config/config-chain-ids';
import { processTransaction } from '../../transactions/process-transaction';
import { getRailgunWalletPubKey } from '../../wallets/active-wallets';

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
): Promise<Optional<JsonRpcResult<string>>> => {
  const { chainID, feesID: feeCacheID, serializedTransaction, pubkey } = params;
  const railgunWalletPubKey = getRailgunWalletPubKey();
  if (railgunWalletPubKey !== pubkey) {
    return undefined;
  }
  try {
    const txResponse = await processTransaction(
      chainID,
      feeCacheID,
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
