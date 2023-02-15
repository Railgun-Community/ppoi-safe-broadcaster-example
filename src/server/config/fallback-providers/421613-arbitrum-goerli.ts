import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 421613,
  providers: [
    {
      provider: 'https://goerli-rollup.arbitrum.io/rpc',
      priority: 3,
      weight: 2,
      stallTimeout: 2500,
    },
  ],
};

export default config;
