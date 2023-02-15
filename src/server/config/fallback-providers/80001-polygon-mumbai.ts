import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 80001,
  providers: [
    {
      provider:
        'https://polygon-mumbai.gateway.pokt.network/v1/lb/627a4b6e18e53a003a6b6c26',
      priority: 1,
      weight: 2,
      stallTimeout: 2500,
    },
    {
      provider: 'https://rpc-mumbai.maticvigil.com',
      priority: 2,
      weight: 1,
    },
  ],
};

export default config;
