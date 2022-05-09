import { FallbackProviderJsonConfig } from '../../../models/provider-models';

const config: FallbackProviderJsonConfig = {
  chainId: 1,
  providers: [
    {
      provider: 'https://eth.railgun.ch',
      priority: 1,
      weight: 1,
    },
    {
      provider: 'https://eth.railgun.org',
      priority: 1,
      weight: 1,
    },
    {
      provider:
        'https://eth-mainnet.gateway.pokt.network/v1/6004bcd10040261633ade990',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://cloudflare-eth.com/',
      priority: 2,
      weight: 1,
    },
    {
      provider: 'https://rpc.ankr.com/eth',
      priority: 2,
      weight: 1,
    },
  ],
};

export default config;
