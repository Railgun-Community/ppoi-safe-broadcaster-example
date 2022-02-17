import { CoingeckoNetworkID } from './api-constants';
import { RailProxyContract } from './contract-constants';
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
  proxyContract: RailProxyContract;
  deploymentBlock?: number;
  fallbackProviderConfig: FallbackProviderJsonConfig;
  gasToken: GasTokenConfig;
  coingeckoId?: CoingeckoNetworkID;
  priceTTLInMS: number;
  fees: NetworkFeeSettings;
  quickSyncURL?: QuickSyncURL;
  isTestNetwork?: boolean;
};

export enum QuickSyncURL {
  Ropsten = 'https://relayer.railgun.ch/events/3',
}
