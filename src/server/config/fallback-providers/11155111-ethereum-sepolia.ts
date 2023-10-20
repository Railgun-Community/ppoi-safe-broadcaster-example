import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 11155111,
  providers: [
    {
      provider: 'https://rpc.ankr.com/eth_sepolia',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 1, // Supports up to 10, but at 1 ethers handles getLogs differently, and this seems to be more stable.
      stallTimeout: 2500,
    },
    {
      provider: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://ethereum-sepolia.publicnode.com',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
