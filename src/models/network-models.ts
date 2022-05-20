import { CoingeckoNetworkID } from './api-constants';
import {
  RailProxyContract,
  RailProxyDeploymentBlock,
} from './contract-constants';
import { FallbackProviderJsonConfig } from './provider-models';
import { GasTokenConfig } from './token-models';

export enum EVMGasType {
  Type0 = 'Type0',
  Type2 = 'Type2',
}

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
  deploymentBlock?: RailProxyDeploymentBlock;
  fallbackProviderConfig: FallbackProviderJsonConfig;
  gasToken: GasTokenConfig;
  coingeckoNetworkId?: CoingeckoNetworkID;
  priceTTLInMS: number;
  fees: NetworkFeeSettings;
  isTestNetwork?: boolean;
  skipQuickScan?: boolean;
  evmGasType: EVMGasType;
};
