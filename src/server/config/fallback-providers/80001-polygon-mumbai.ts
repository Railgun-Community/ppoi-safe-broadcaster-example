import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 80001,
  providers: [
    {
      provider: 'https://endpoints.omniatech.io/v1/matic/mumbai/public',
      priority: 2,
      weight: 2,
      stallTimeout: 2500,
    },
    {
      provider: 'https://polygon-mumbai-bor.publicnode.com',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
