import { FallbackProviderJsonConfig } from '../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 137,
  providers: [
    {
      provider: 'https://rpc.ankr.com/polygon',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://polygon-rpc.com',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://rpc-mainnet.maticvigil.com',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://rpc-mainnet.matic.quiknode.pro',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://matic-mainnet.chainstacklabs.com',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://matic-mainnet-full-rpc.bwarelabs.com',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://matic-mainnet-archive-rpc.bwarelabs.com',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://rpc-mainnet.matic.network',
      priority: 1,
      weight: 1,
    },
  ],
};

export default config;
