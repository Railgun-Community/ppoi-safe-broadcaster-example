import type { BroadcasterChain } from '../../../models/chain-models';
import type { WakuMethodResponse } from '../waku-response';
import { contentTopics } from '../topics';
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';

type MetricsMethodParams = {
  timestamp: number;
};

type MetricsMethodResponse = {
  recvTimestamp: number;
  timeDifference: number;
  sendTimestamp: number;
};

export const metricsMethod = async (
  params: MetricsMethodParams,
  id: number,
  incomingChain: BroadcasterChain,
): Promise<Optional<WakuMethodResponse>> => {
  // incoming message params
  const now = Date.now();
  const { timestamp } = params;

  // calculate the time difference
  const timeDifference = now - timestamp;
  const result: MetricsMethodResponse = {
    recvTimestamp: now,
    timeDifference,
    sendTimestamp: Date.now(),
  };
  const rpcResult = formatJsonRpcResult(id, result);
  return {
    rpcResult,
    contentTopic: contentTopics.metrics(),
  };
};
