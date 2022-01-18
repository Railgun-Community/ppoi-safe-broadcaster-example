import { FallbackProviderJsonConfig } from './provider-models';
import { GasTokenConfig } from './token-models';

export type Network = {
  name: string;
  gasToken: GasTokenConfig;
  railContract: string;
  coingeckoId: string;
  fallbackProviderConfig: FallbackProviderJsonConfig;
};
