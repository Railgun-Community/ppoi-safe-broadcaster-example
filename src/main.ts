import debug from 'debug';
import {
  initBroadcasterModules,
  uninitBroadcasterModules,
} from 'server/init/broadcaster-init';
import {
  WakuBroadcaster,
  WakuBroadcasterOptions,
} from 'server/waku-broadcaster/waku-broadcaster';
import { delay } from 'util/promise-utils';
import config from 'server/config/config-defaults';
import { WakuRestApiClient } from 'server/networking/waku-rest-api-client';
import { waitForWaku } from './server/networking/waku-poller';
import { closeSettingsDB } from './server/db/settings-db';

const dbg = debug('broadcaster:main');

let broadcaster: WakuBroadcaster;

const main = async (): Promise<void> => {
  dbg('Warming up Broadcaster');

  await initBroadcasterModules();

  // Note that this default can be overridden in initBroadcasterModules().
  await waitForWaku(config.waku.rpcURL);
  dbg(`Connecting to ${config.waku.rpcURL}`);

  const client = new WakuRestApiClient({
    url: config.waku.rpcURL,
  });
  const options: WakuBroadcasterOptions = {
    topic: config.waku.pubSubTopic,
    feeExpiration: config.transactionFees.feeExpirationInMS,
  };
  broadcaster = await WakuBroadcaster.init(client, options);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  broadcaster.poll(config.waku.pollFrequencyInMS);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  broadcaster.broadcastFeesOnInterval(config.waku.broadcastFeesDelayInMS);
  // print multiaddress of nim-waku instance
  dbg(await broadcaster.client.getDebug());
};

process.on('SIGINT', async () => {
  dbg('shutting down');
  await uninitBroadcasterModules();
  await closeSettingsDB();
  await broadcaster.stop();
  await delay(2000);
  process.exit(0);
});

process.on('unhandledRejection', (err: Error | string) => {
  if (err.toString().includes('could not coalesce error')) {
    return;
  }
  dbg('unhandledRejection', err);
});
process.on('uncaughtException', (err: Error | string) => {
  dbg('uncaughtException', err);
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
