import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 5,
  providers: [
    {
      provider: 'https://ethereum-goerli.publicnode.com',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
      stallTimeout: 2500,
    },
    {
      provider: 'https://rpc.ankr.com/eth_goerli',
      priority: 2,
      weight: 2,
      maxLogsPerBatch: 10,
    },
  ],
};

export default config;
