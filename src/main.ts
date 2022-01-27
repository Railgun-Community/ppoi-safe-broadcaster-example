import { initRelayer } from 'services/init/relayer-init';
import { initWaku, sendRequest } from 'services/networking/waku';
import debug from 'debug';
import configDefaults from 'config/config-defaults';
import { DebugLevel } from './models/debug-models';

const dbg = debug('delayer:main');

const main = async (): Promise<void> => {
  dbg('starting delayer');

  initRelayer();
  const directPeers = configDefaults.directPeers;
  const options = {
    bootstrap: { default: true },
    libp2p: {},
  };
  const waku = await initWaku(directPeers, options);
  dbg('waku peers', waku.relay.getPeers());

  await sendRequest({ method: 'greet', params: { name: 'railgun' } });
};

main();
