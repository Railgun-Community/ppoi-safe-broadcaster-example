import { FallbackProviderJsonConfig } from '../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 3,
  providers: [
    {
      provider: 'https://ropsten.infura.io/v3/84842078b09946638c03157f83405213',
      priority: 1,
      weight: 1,
    },
    {
      provider:
        'https://eth-rinkeby.gateway.pokt.network/v1/6004bd4d0040261633ade991',
      priority: 1,
      weight: 1,
    },
    {
      provider:
        'https://eth-ropsten.alchemyapi.io/v2/_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC',
      priority: 1,
      weight: 1,
    },
    {
      provider:
        'wss://eth-ropsten.alchemyapi.io/v2/_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC',
      priority: 1,
      weight: 1,
    },
  ],
};

export default config;
