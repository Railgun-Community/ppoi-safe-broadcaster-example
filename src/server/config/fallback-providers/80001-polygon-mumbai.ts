import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 80001,
  providers: [
    {
      provider: 'https://polygon-mumbai-bor.publicnode.com',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://endpoints.omniatech.io/v1/matic/mumbai/public',
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 10,
    },
  ],
};

export default config;
