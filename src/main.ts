import { initRelayer } from 'services/relayer-init';
import { initWaku, sendRequest } from 'services/networking/waku';
import debug from 'debug';
import configDefaults from 'config/config-defaults';
import { DebugLevel } from './models/debug-models';

const dbg = debug('delayer:main');

const main = async (): Promise<void> => {
  dbg('starting delayer');

  initRelayer();
  const options = {
    bootstrap: { default: true },
    libp2p: {
      directPeers: configDefaults.directPeers,
    },
  };
  const waku = await initWaku(options);
  dbg('waku peers', waku.relay.getPeers());

  await sendRequest({ method: 'greet', params: { name: 'railgun' } });
};

main();
