import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 42161,
  providers: [
    {
      provider: 'https://rpc.ankr.com/arbitrum',
      priority: 2,
      weight: 2,
      stallTimeout: 2500,
      disableBatching: true,
    },
    {
      provider: 'https://arbitrum.blockpi.network/v1/rpc/public',
      priority: 2,
      weight: 2,
      disableBatching: true,
    },
  ],
};

export default config;
