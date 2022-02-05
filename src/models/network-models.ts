import { CoingeckoNetworkID } from './api-constants';
import { FallbackProviderJsonConfig } from './provider-models';
import { GasTokenConfig } from './token-models';

export type NetworkFeeSettings = {
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
  coingeckoId?: CoingeckoNetworkID;
  priceTTLInMS: number;
  fees: NetworkFeeSettings;
  quickSyncURL?: QuickSyncURL;
  isTestNetwork?: boolean;
};

export enum QuickSyncURL {
  Ropsten = 'http://relayer.railgun.ch:3000/',
}
