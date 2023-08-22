import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 56,
  providers: [
    {
      provider: 'https://bsc.publicnode.com',
      priority: 1,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://bsc-dataseed.binance.org',
      priority: 1,
      weight: 2,
      maxLogsPerBatch: 10,
    },
    {
      provider: 'https://bsc-dataseed1.defibit.io',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
    },
    {
      provider: 'https://bsc-dataseed1.ninicoin.io',
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 10,
    },
  ],
};

export default config;
