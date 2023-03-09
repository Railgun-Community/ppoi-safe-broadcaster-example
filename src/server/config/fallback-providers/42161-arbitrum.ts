import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 42161,
  providers: [
    {
      provider: 'https://arbitrum.blockpi.network/v1/rpc/public',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://rpc.ankr.com/arbitrum',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
