import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 421613,
  providers: [
    {
      provider: 'https://goerli-rollup.arbitrum.io/rpc',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://arbitrum-goerli.publicnode.com',
      priority: 3,
      weight: 2,
      maxLogsPerBatch: 10,
    },
  ],
};

export default config;
