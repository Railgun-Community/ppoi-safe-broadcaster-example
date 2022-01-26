import { Waku, WakuMessage } from 'js-waku';
import { client } from 'services/networking/jsonrpc';
import debug from 'debug';
import { CreateOptions } from 'js-waku/build/main/lib/waku';

const dbg = debug('delayer:waku');
let waku: Waku;

export const ContentTopic = '/railgun/1/relayer/proto';
export type JSONRPCRequest = { method: string; params: any };

// send jsonrpc request through waku relayer
export async function sendRequest(request: JSONRPCRequest): Promise<void> {
  const payload = JSON.stringify(request);
  dbg('relaying request:', request);
  const msg = await WakuMessage.fromUtf8String(payload, ContentTopic);
  await waku.relay.send(msg);
}

// extract jsonrpc request from WakuMessage and get response from JSONRPC server method
const processIncomingMessage = async (wakuMessage: WakuMessage) => {
  const { payload } = wakuMessage;
  if (!payload || payload.length === 0) return;
  const { method, params } = JSON.parse(payload.toString());
  const res = await client.call(method, params);
  dbg('JSONRPC response:', res);
};

export const initWaku = async (
  directPeers: string[],
  createOptions?: CreateOptions,
): Promise<Waku> => {
  const options = createOptions ?? { bootstrap: { default: true } };

  waku = await Waku.create(options);
  dbg('initializing Waku');
  await waku.waitForConnectedPeer();
  await waku.dial(directPeers[0]).catch((e) => {
    dbg(e);
  });
  waku.libp2p.connectionManager.on('peer:connect', (connection) => {
    dbg('peer:connect', connection);
  });
  waku.libp2p.on('peer:discovery', (peer) => {
    dbg('peer:discovery', peer);
  });

  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) =>
    waku.libp2p.pubsub.once('gossipsub:heartbeat', resolve),
  );
  dbg('heartbeat resolved');
  waku.libp2p.peerStore.on('change:protocols', ({ peerId, protocols }) => {
    dbg({ peerId, protocols });
  });
  // only process messages matching our ContentTopic
  waku.relay.addObserver(processIncomingMessage, [ContentTopic]);
  return waku;
};
