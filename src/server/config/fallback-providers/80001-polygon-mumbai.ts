import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 80001,
  providers: [
    {
      provider: 'https://rpc-mumbai.maticvigil.com',
      priority: 2,
      weight: 2,
    },
  ],
};

export default config;
