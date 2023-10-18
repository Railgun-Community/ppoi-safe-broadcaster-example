import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 5,
  providers: [
    {
      provider: 'https://rpc.ankr.com/eth_goerli',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 1, // Supports up to 10, but at 1 ethers handles getLogs differently, and this seems to be more stable.
      stallTimeout: 2500,
    },
    {
      provider: 'https://endpoints.omniatech.io/v1/eth/goerli/public',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://ethereum-goerli.publicnode.com',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
