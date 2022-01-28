import { Waku, WakuMessage, DefaultPubSubTopic } from 'js-waku';
import debug from 'debug';
import { JsonRpcPayload } from '@walletconnect/jsonrpc-types';
import { formatJsonRpcRequest } from '@walletconnect/jsonrpc-utils';
import configDefaults from 'config/config-defaults';

const dbg = debug('delayer:client');

// export const PubSubTopic = '/railgun/1/relayer/json';
export const PubSubTopic = DefaultPubSubTopic;
export const ContentTopics = {
  default: '/railgun/1/default/json',
  greet: '/railgun/1/greet/json',
  fees: '/railgun/1/fees/json',
};

const processIncomingMessage = (msg: WakuMessage) => {
  const { payload, timestamp, payloadAsUtf8 } = msg;
  if (!payload || payload.length === 0 || !timestamp) return;

  const delay = Date.now() - timestamp.getTime();
  dbg(`(+${delay}ms) message received:`, JSON.parse(payloadAsUtf8));
};

const sendMessage = async (waku: Waku) => {
  const payload: JsonRpcPayload = formatJsonRpcRequest('greet', {
    name: 'railgun client',
  });
  const message = await WakuMessage.fromUtf8String(
    JSON.stringify(payload),
    ContentTopics.greet,
  );
  await waku.relay.send(message);
  dbg('sent message', {
    message,
    topic: waku.relay.pubSubTopic,
    topics: waku.relay.getTopics(),
  });
};

const updateFees = (message: WakuMessage) => {
  dbg('updateFees');
  if (message.contentTopic !== ContentTopics.fees) return;
  dbg('fees ok');

  const feeObj = JSON.parse(message.payloadAsUtf8);
  dbg('updated fees', feeObj);
};

const connect = async (): Promise<Waku> => {
  dbg('creating js-waku client');
  const waku = await Waku.create({
    // pubSubTopic: PubSubTopic,
    bootstrap: { default: true },
    libp2p: {
      addresses: { listen: ['/ip4/0.0.0.0/tcp/0/ws'] },
    },
  });
  dbg('waiting for remote peer');
  await waku.waitForRemotePeer();
  // dialing direct peer by dns address works until its address is stored and returned as ipv4
  // then it fails
  dbg('dialing direct peer');
  await waku.dial(configDefaults.directPeers[0]);
  dbg('peers: ', waku.relay.peers.keys());
  dbg('multiaddr', waku.getLocalMultiaddrWithID());
  dbg(`pubsubTopic: ${waku.relay.pubSubTopic}`);

  return waku;
};

const main = async () => {
  dbg('connecting to waku..');
  const waku = await connect();
  dbg('connected');
  waku.relay.addObserver(updateFees, [ContentTopics.fees]);
  waku.relay.addObserver(processIncomingMessage, [ContentTopics.greet]);

  await sendMessage(waku);
  setInterval(sendMessage, 10000 * 10, waku);
  dbg('observing contentTopics:', waku.relay.observers);
};

main();
