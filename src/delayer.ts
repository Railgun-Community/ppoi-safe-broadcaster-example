import { Waku, WakuMessage, getBootstrapNodes } from 'js-waku';
import { client } from './jsonrpc';
import { initRelayer } from './services/init-service';

const { log } = console;
const ContentTopic = '/railgun/1/relayer/proto';

let delayer: Waku;

type JSONRPCRequest = { method: string; params: any };

// send jsonrpc request through waku relayer
async function sendRequest(request: JSONRPCRequest): Promise<void> {
  const payload = JSON.stringify(request);
  log('relaying request: ', request);
  const msg = await WakuMessage.fromUtf8String(payload, ContentTopic);
  await delayer.relay.send(msg);
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

  delayer = await Waku.create({ bootstrap: true });
  await delayer.waitForConnectedPeer();

  // only process messages matching our ContentTopic
  delayer.relay.addObserver(processIncomingMessage, [ContentTopic]);

  await sendRequest({ method: 'greet', params: { name: 'railgun' } });
};

main();
