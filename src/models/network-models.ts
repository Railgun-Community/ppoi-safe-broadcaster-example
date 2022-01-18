import { GasTokenConfig } from './token-models';

export interface Network {
  name: string;
  gasToken: GasTokenConfig;
  railContract: string;
  coingeckoId: string;
}
