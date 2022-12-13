import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 421613,
  providers: [
    {
      provider:
        'https://arb-goerli.g.alchemy.com/v2/mjJ4r5yqS3ouvBBKUbcAZGFYIrcyguVE',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://goerli-rollup.arbitrum.io/rpc',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
