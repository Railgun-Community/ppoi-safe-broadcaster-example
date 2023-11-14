import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 42161,
  providers: [
    {
      provider: 'https://rpc.ankr.com/arbitrum',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 1, // Supports up to 10, but at 1 ethers handles getLogs differently, and this seems to be more stable.
      stallTimeout: 2500,
    },
    {
      provider: 'https://arbitrum.blockpi.network/v1/rpc/public',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
