import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 42161,
  providers: [
    {
      provider: 'https://endpoints.omniatech.io/v1/arbitrum/one/public',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://arbitrum-one.publicnode.com',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
    },
    {
      provider: 'https://rpc.ankr.com/arbitrum',
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 10,
    },
  ],
};

export default config;
