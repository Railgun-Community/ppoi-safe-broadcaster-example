import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 137,
  providers: [
    {
      provider:
        'https://poly-mainnet.gateway.pokt.network/v1/lb/627a4b6e18e53a003a6b6c26',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://rpc.ankr.com/polygon',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://polygon-rpc.com',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://rpc-mainnet.maticvigil.com',
      priority: 2,
      weight: 1,
    },
    {
      provider:
        'https://polygon-mainnet.g.alchemy.com/v2/mjJ4r5yqS3ouvBBKUbcAZGFYIrcyguVE',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://rpc-mainnet.matic.quiknode.pro',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://matic-mainnet.chainstacklabs.com',
      priority: 3,
      weight: 1,
    },
    {
      provider: 'https://matic-mainnet-archive-rpc.bwarelabs.com',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
