import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 56,
  providers: [
    {
      provider: 'https://bsc.publicnode.com',
      priority: 1,
      weight: 2,
      stallTimeout: 2500,
      maxLogsPerBatch: 1, // Supports up to 10, but at 1 ethers handles getLogs differently, and this seems to be more stable.
    },
    {
      provider: 'https://bsc-dataseed.binance.org/',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed1.defibit.io/',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed1.ninicoin.io/',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
