import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 56,
  providers: [
    {
      provider: 'https://bsc-dataseed.binance.org/',
      priority: 2,
      weight: 2,
      stallTimeout: 2500,
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
