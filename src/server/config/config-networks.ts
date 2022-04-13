import { GasTokenWrappedAddress } from '../../models/token-models';

// Fallback Provider configs
import fallbackProvidersEthereum from './fallback-providers/1-ethereum';
import fallbackProvidersRopsten from './fallback-providers/3-ropsten';
import fallbackProvidersBNBSmartChain from './fallback-providers/56-binance-smart-chain';
import fallbackProvidersPolygon from './fallback-providers/137-polygon';
import fallbackProvidersHardhat from './fallback-providers/31337-hardhat';
import { CoingeckoNetworkID } from '../../models/api-constants';
import {
  RailProxyContract,
  RailProxyDeploymentBlock,
} from '../../models/contract-constants';
import { NetworkChainID } from './config-chain-ids';
import { NetworksConfig } from '../../models/config-models';
import { QuickSyncURL } from '../../models/network-models';

const defaultFees = {
  slippageBuffer: 0.03,
  profit: 0.07,
};

export default {
  [NetworkChainID.Ethereum]: {
    name: 'Ethereum',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.EthereumWETH,
    },
    fees: defaultFees,
    proxyContract: RailProxyContract.Ethereum,
    coingeckoId: CoingeckoNetworkID.Ethereum,
    fallbackProviderConfig: fallbackProvidersEthereum,
    priceTTLInMS: 5 * 60 * 1000,
  },
  [NetworkChainID.Ropsten]: {
    name: 'Ropsten Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.RopstenWETH,
    },
    fees: defaultFees,
    proxyContract: RailProxyContract.Ropsten,
    deploymentBlock: RailProxyDeploymentBlock.Ropsten,
    fallbackProviderConfig: fallbackProvidersRopsten,
    priceTTLInMS: 5 * 60 * 1000,
    quickSyncURL: QuickSyncURL.Ropsten,
    isTestNetwork: true,
  },
  [NetworkChainID.BNBSmartChain]: {
    name: 'Binance Smart Chain',
    gasToken: {
      symbol: 'BNB',
      wrappedAddress: GasTokenWrappedAddress.BinanceWBNB,
    },
    fees: defaultFees,
    proxyContract: RailProxyContract.BNBSmartChain,
    coingeckoId: CoingeckoNetworkID.BNBSmartChain,
    fallbackProviderConfig: fallbackProvidersBNBSmartChain,
    priceTTLInMS: 5 * 60 * 1000,
  },
  [NetworkChainID.PolygonPOS]: {
    name: 'Polygon PoS',
    gasToken: {
      symbol: 'MATIC',
      wrappedAddress: GasTokenWrappedAddress.PolygonWMATIC,
    },
    fees: defaultFees,
    proxyContract: RailProxyContract.PolygonPOS,
    coingeckoId: CoingeckoNetworkID.PolygonPOS,
    fallbackProviderConfig: fallbackProvidersPolygon,
    priceTTLInMS: 5 * 60 * 1000,
  },
  [NetworkChainID.HardHat]: {
    name: 'HardHat Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.None,
    },
    fees: defaultFees,
    proxyContract: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    fallbackProviderConfig: fallbackProvidersHardhat,
    priceTTLInMS: 5 * 60 * 1000,
    isTestNetwork: true,
  },
} as NetworksConfig;
