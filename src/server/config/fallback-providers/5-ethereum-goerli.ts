import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 5,
  providers: [
    {
      provider: 'https://rpc.ankr.com/eth_goerli',
      priority: 2,
      weight: 2,
      stallTimeout: 2500,
    },
  ],
};

export default config;
