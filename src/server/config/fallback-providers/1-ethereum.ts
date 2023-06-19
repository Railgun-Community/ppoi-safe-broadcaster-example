import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 1,
  providers: [
    {
      provider: 'https://rpc.ankr.com/eth',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://cloudflare-eth.com/',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
