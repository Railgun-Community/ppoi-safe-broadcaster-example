import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 421613,
  providers: [
    {
      provider: 'https://goerli-rollup.arbitrum.io/rpc',
      priority: 2,
      weight: 2,
      stallTimeout: 2500,
    },
  ],
};

export default config;
