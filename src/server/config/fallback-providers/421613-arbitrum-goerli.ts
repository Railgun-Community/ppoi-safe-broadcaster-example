import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 421613,
  providers: [
    {
      provider: 'https://goerli-rollup.arbitrum.io/rpc',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
