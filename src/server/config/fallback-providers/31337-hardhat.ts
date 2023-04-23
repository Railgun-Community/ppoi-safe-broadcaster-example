import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 31337,
  providers: [
    {
      provider: process.env.HARDHAT_RPC_URL ?? 'http://127.0.0.1:8545',
      priority: 1,
      weight: 2,
    },
  ],
};

export default config;
