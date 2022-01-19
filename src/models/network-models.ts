import { CoingeckoID } from './api-constants';
import { FallbackProviderJsonConfig } from './provider-models';
import { GasTokenConfig } from './token-models';

export type Network = {
  name: string;
  railContract: string;
  fallbackProviderConfig: FallbackProviderJsonConfig;
  gasToken: GasTokenConfig;
  priceTTLInMS: number;
  coingeckoId?: CoingeckoID;
};
