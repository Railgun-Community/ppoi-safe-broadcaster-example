import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 1,
  providers: [
    {
      provider:
        'https://eth-mainnet.gateway.pokt.network/v1/lb/627a4b6e18e53a003a6b6c26',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://cloudflare-eth.com/',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://rpc.ankr.com/eth',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
