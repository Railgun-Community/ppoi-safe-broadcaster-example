import { Waku, WakuMessage } from 'js-waku';
import { client } from './services/networking/jsonrpc';
import { initRelayer } from './services/relayer-init';

const { log } = console;
const ContentTopic = '/railgun/1/relayer/proto';

let waku: Waku;

type JSONRPCRequest = { method: string; params: any; };

// send jsonrpc request through waku relayer
async function sendRequest(request: JSONRPCRequest): Promise<void> {
  const payload = JSON.stringify(request);
  log('relaying request: ', request);
  const msg = await WakuMessage.fromUtf8String(payload, ContentTopic);
  await waku.relay.send(msg);
}

// extract jsonrpc request from WakuMessage and get response from JSONRPC server method
const processIncomingMessage = async (wakuMessage: WakuMessage) => {
  const { payload } = wakuMessage;
  if (!payload || payload.length === 0) return;
  const { method, params } = JSON.parse(payload.toString());
  const res = await client.call(method, params);
  log('JSONRPC response: ', res);
};

const main = async () => {
  log('starting delayer');

  initRelayer();
  waku = await Waku.create({ bootstrap: { default: true } });
  await waku.waitForConnectedPeer();
  log('peers:', waku.relay.getPeers());

  // only process messages matching our ContentTopic
  waku.relay.addObserver(processIncomingMessage, [ContentTopic]);

  await sendRequest({ method: 'greet', params: { name: 'railgun' } });
};

main();
