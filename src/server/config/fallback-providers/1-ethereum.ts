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
      provider: 'https://eth.llamarpc.com',
      priority: 3,
      weight: 2,
    },
  ],
};

export default config;
