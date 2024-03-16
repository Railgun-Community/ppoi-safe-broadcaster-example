import debug from 'debug';
import {
  initRelayerModules,
  uninitRelayerModules,
} from 'server/init/relayer-init';
import {
  WakuRelayer,
  WakuRelayerOptions,
} from 'server/waku-relayer/waku-relayer';
import { delay } from 'util/promise-utils';
import config from 'server/config/config-defaults';
import { WakuRestApiClient } from 'server/networking/waku-rest-api-client';
import { waitForWaku } from './server/networking/waku-poller';

const dbg = debug('relayer:main');

let relayer: WakuRelayer;

const main = async (): Promise<void> => {
  dbg('Warming up Relayer');

  await initRelayerModules();

  // Note that this default can be overridden in initRelayerModules().
  await waitForWaku(config.waku.rpcURL);
  dbg(`Connecting to ${config.waku.rpcURL}`);

  const client = new WakuRestApiClient({
    url: config.waku.rpcURL,
    urlBackup: config.waku.rpcURLBackup,
  });
  const options: WakuRelayerOptions = {
    topic: config.waku.pubSubTopic,
    feeExpiration: config.transactionFees.feeExpirationInMS,
  };
  relayer = await WakuRelayer.init(client, options);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  relayer.poll(config.waku.pollFrequencyInMS);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  relayer.broadcastFeesOnInterval(config.waku.broadcastFeesDelayInMS);
  // print multiaddress of nim-waku instance
  dbg(await relayer.client.getDebug());
};

process.on('SIGINT', async () => {
  dbg('shutting down');
  await uninitRelayerModules();
  await relayer.stop();
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
