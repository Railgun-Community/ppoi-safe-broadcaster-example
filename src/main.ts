import debug from 'debug';
import { initRelayerModules } from 'server/init/relayer-init';
import { WakuRelayer, WAKU_TOPIC } from 'server/waku-relayer/waku-relayer';
import configDefaults from './server/config/config-defaults';
import { WakuApiClient } from './server/networking/waku-api-client';

const dbg = debug('relayer:main');

const main = async (): Promise<void> => {
  dbg('Warming up Relayer');

  await initRelayerModules();

  // Note that this default can be overridden in initRelayerModules().
  const { rpcURL } = configDefaults.waku;
  dbg(`Connecting to ${rpcURL}`);

  const client = new WakuApiClient({ url: rpcURL });
  const wakuRelayer = await WakuRelayer.init(client, {
    topic: WAKU_TOPIC,
  });
  // print multiaddress of nim-waku instance
  dbg(await wakuRelayer.client.getDebug());
};

main();
