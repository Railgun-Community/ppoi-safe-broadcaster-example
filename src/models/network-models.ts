import { CoingeckoID } from './api-constants';
import { FallbackProviderJsonConfig } from './provider-models';
import { GasTokenConfig } from './token-models';

type NetworkFeeSettings = {
  // As a percentage of the estimated gas fee.
  slippageBuffer: 0.05;
  // As a percentage of the estimated gas fee.
  profit: 0.05;
};

export type Network = {
  name: string;
  railContract: string;
  fallbackProviderConfig: FallbackProviderJsonConfig;
  gasToken: GasTokenConfig;
  coingeckoId?: CoingeckoID | string;
  priceTTLInMS: number;
  fees: NetworkFeeSettings;
};
