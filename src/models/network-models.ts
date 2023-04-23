import {
  RailgunProxyContract,
  RelayAdaptContract,
  RailgunProxyDeploymentBlock,
} from '@railgun-community/shared-models';
import { CoingeckoNetworkID } from './api-constants';
import { FallbackProviderJsonConfig } from './provider-models';
import { GasTokenConfig } from './token-models';
import { FeeConfig } from './fee-config';

export enum PaymasterContractAddress {
  Ethereum = '', // TODO
  BNBChain = '', // TODO
  PolygonPOS = '', // TODO
  Arbitrum = '', // TODO
  EthereumRopsten = '',
  EthereumGoerli = '', // TODO
  PolygonMumbai = '', // TODO
  ArbitrumGoerli = '', // TODO
  Hardhat = '0x172076E0166D1F9Cc711C77Adf8488051744980C',
}

export type Network = {
  name: string;
  proxyContract: RailgunProxyContract;
  relayAdaptContract: RelayAdaptContract;
  paymasterContract: PaymasterContractAddress;
  deploymentBlock?: RailgunProxyDeploymentBlock;
  fallbackProviderConfig: FallbackProviderJsonConfig;
  gasToken: GasTokenConfig;
  coingeckoNetworkId?: CoingeckoNetworkID;
  priceTTLInMS: number;
  fees: FeeConfig;
  isTestNetwork?: boolean;
  skipQuickScan?: boolean;
};
