import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 5,
  providers: [
    {
      provider:
        'https://eth-goerli.gateway.pokt.network/v1/lb/627a4b6e18e53a003a6b6c26',
      priority: 1,
      weight: 2,
      stallTimeout: 2500,
    },
    {
      provider: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://rpc.ankr.com/eth_goerli',
      priority: 3,
      weight: 1,
    },
  ],
};

export default config;
