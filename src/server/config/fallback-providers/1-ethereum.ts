import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 1,
  providers: [
    {
      provider: 'https://eth.railgun.ch',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://eth.railgun.org',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://rpc.ankr.com/eth',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://cloudflare-eth.com',
      priority: 2,
      weight: 1,
    },
  ],
};

export default config;
