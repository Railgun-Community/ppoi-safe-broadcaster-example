import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';
import { CoingeckoNetworkID } from './api-constants';
import { GasTokenConfig } from './token-models';
import { FeeConfig } from './fee-config';

export type Network = {
  name: string;
  proxyContract: string;
  relayAdaptContract: string;
  deploymentBlock: number;
  fallbackProviderConfig: FallbackProviderJsonConfig;
  gasToken: GasTokenConfig;
  coingeckoNetworkId?: CoingeckoNetworkID;
  priceTTLInMS: number;
  fees: FeeConfig;
  isTestNetwork?: boolean;
  skipQuickScan?: boolean;
  topUp: TopUpConfig;
  retryGasBuffer: bigint;
};

type TopUpConfig = {
  allowMultiTokenTopUp: boolean;
  accumulateNativeToken: boolean;
  toleratedSlippage: number;
  maxSpendPercentage: number;
  swapThresholdIntoGasToken: bigint;
  minimumGasBalanceForTopup: bigint;
  useZeroXForSwap: boolean;
};
