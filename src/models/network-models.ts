import { CoingeckoNetworkID } from './api-constants';
import { RailProxyContract } from './contract-constants';
import { FallbackProviderJsonConfig } from './provider-models';
import { GasTokenConfig } from './token-models';

export type NetworkFeeSettings = {
  // Slippage is a percentage of the estimated gas fee. Recommended at 0.03 - 0.05.
  // A low buffer means that your Relayer may cancel execution for proven
  // transactions, which can cause clients to de-prioritize your Relayer.
  slippageBuffer: number;

  // As a percentage of the estimated gas fee.
  profit: number;
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
