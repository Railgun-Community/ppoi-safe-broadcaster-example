import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 42161,
  providers: [
    {
      provider: 'https://rpc.ankr.com/arbitrum',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://arbitrum.blockpi.network/v1/rpc/public',
      priority: 2,
      weight: 2,
    },
  ],
};

export default config;
