import {
  RailgunProxyContract,
  RelayAdaptContract,
  RailgunProxyDeploymentBlock,
} from '@railgun-community/shared-models';
import { CoingeckoNetworkID } from './api-constants';
import { FallbackProviderJsonConfig } from './provider-models';
import { GasTokenConfig } from './token-models';
import { FeeConfig } from './fee-config';

export type Network = {
  name: string;
  proxyContract: RailgunProxyContract;
  relayAdaptContract: RelayAdaptContract;
  deploymentBlock?: RailgunProxyDeploymentBlock;
  fallbackProviderConfig: FallbackProviderJsonConfig;
  gasToken: GasTokenConfig;
  coingeckoNetworkId?: CoingeckoNetworkID;
  priceTTLInMS: number;
  fees: FeeConfig;
  isTestNetwork?: boolean;
  skipQuickScan?: boolean;
};
