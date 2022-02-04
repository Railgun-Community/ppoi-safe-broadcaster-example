import debug from 'debug';
import { initRelayer } from 'server/init/relayer-init';
import { WakuRelayer, WAKU_TOPIC } from 'server/waku-relayer/waku-relayer';

const dbg = debug('relayer:main');

const main = async (): Promise<void> => {
  dbg('Warming up Relayer');

  const wakuRelayer = await WakuRelayer.init({
    url: 'http://relayer.of.holdings:8546',
    topic: WAKU_TOPIC,
    pollFrequency: 10 * 1000,
  });
  dbg(await wakuRelayer.client.getDebug());

  initRelayer();
};

main();
