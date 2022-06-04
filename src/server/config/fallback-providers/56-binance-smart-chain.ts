import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 56,
  providers: [
    {
      provider:
        'https://bsc-mainnet.gateway.pokt.network/v1/lb/627a4b6e18e53a003a6b6c26',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed.binance.org/',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed1.defibit.io/',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed1.ninicoin.io/',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed2.defibit.io/',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed3.defibit.io',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed4.defibit.io',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed2.ninicoin.io',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed3.ninicoin.io',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed4.ninicoin.io',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed1.binance.org',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed2.binance.org',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed3.binance.org',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://bsc-dataseed4.binance.org',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
