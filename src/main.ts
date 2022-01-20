import { initRelayer } from 'services/relayer-init';
import { initWaku, sendRequest } from 'services/networking/waku';
import defaultConfig from 'config/config-defaults';
import debug from 'debug';

const dbg = debug('delayer:main');

const main = async (): Promise<void> => {
  dbg('starting delayer');

  initRelayer();
  const options = {
    bootstrap: { default: true },
    libp2p: {
      directPeers: defaultConfig.directPeers,
    },
  };
  const waku = await initWaku(options);
  dbg('waku peers', waku.relay.getPeers());

  await sendRequest({ method: 'greet', params: { name: 'railgun' } });
};

main();
