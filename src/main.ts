import debug from 'debug';
import { initRelayerModules } from 'server/init/relayer-init';
import { WakuRelayer, WakuRelayerOptions, WAKU_TOPIC } from 'server/waku-relayer/waku-relayer';
import { getRailgunWallet } from 'server/wallets/active-wallets';
import config from './server/config/config-defaults';
import { WakuApiClient } from './server/networking/waku-api-client';

const dbg = debug('relayer:main');

const main = async (): Promise<void> => {
  dbg('Warming up Relayer');

  await initRelayerModules();

  // Note that this default can be overridden in initRelayerModules().
  const { rpcURL } = config.waku;
  dbg(`Connecting to ${rpcURL}`);

  const client = new WakuApiClient({ url: rpcURL });
  const wallet = getRailgunWallet();
  const options: WakuRelayerOptions = {
    topic: WAKU_TOPIC,
    feeExpiration: config.transactionFees.feeExpirationInMS,
  };
  const relayer = await WakuRelayer.init(client, wallet, options);
  relayer.poll(config.waku.pollFrequencyInMS);
  relayer.broadcastFeesOnInterval(config.waku.broadcastFeesDelayInMS);

  // print multiaddress of nim-waku instance
  dbg(await relayer.client.getDebug());
};

main();
