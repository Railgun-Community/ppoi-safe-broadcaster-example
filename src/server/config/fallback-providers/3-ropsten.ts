import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 3,
  providers: [
    {
      provider:
        'https://eth-ropsten.gateway.pokt.network/v1/lb/627a4b6e18e53a003a6b6c26',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://ropsten.infura.io/v3/84842078b09946638c03157f83405213',
      priority: 2,
      weight: 1,
    },
    {
      provider:
        'https://eth-ropsten.alchemyapi.io/v2/_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC',
      priority: 2,
      weight: 1,
    },
    {
      provider:
        'wss://eth-ropsten.alchemyapi.io/v2/_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC',
      priority: 2,
      weight: 1,
    },
  ],
};

export default config;
