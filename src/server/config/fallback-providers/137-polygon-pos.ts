import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 137,
  providers: [
    {
      provider: 'https://rpc.ankr.com/polygon',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://polygon-rpc.com',
      priority: 3,
      weight: 2,
    },
  ],
};

export default config;
