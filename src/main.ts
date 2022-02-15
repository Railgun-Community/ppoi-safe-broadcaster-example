import debug from 'debug';
import { initRelayer } from 'server/init/relayer-init';
import { WakuRelayer, WAKU_TOPIC } from 'server/waku-relayer/waku-relayer';
import config from 'server/config/config-defaults';

const dbg = debug('relayer:main');

const main = async (): Promise<void> => {
  dbg('Warming up Relayer');
  dbg(`Connecting to ${config.wakuRpcUrl}`);

  const wakuRelayer = await WakuRelayer.init({
    url: config.wakuRpcUrl,
    topic: WAKU_TOPIC,
    pollFrequency: 10 * 1000,
  });
  // print multiaddress of nim-waku instance
  dbg(await wakuRelayer.client.getDebug());

  initRelayer();
};

main();
