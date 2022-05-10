import { GasTokenWrappedAddress } from '../../models/token-models';
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
import { EVMGasType } from '../../models/network-models';

const defaultFees = {
  slippageBuffer: 0.05,
  profit: 0.1,
};

const defaultTokenPriceTTL = 10 * 60 * 1000;

export default {
  [NetworkChainID.Ethereum]: {
    name: 'Ethereum',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.EthereumWETH,
      minimumBalanceForAvailability: 0.1,
    },
    fees: defaultFees,
    proxyContract: RailProxyContract.Ethereum,
    coingeckoId: CoingeckoNetworkID.Ethereum,
    fallbackProviderConfig: fallbackProvidersEthereum,
    priceTTLInMS: defaultTokenPriceTTL,
    evmGasType: EVMGasType.Type2,
  },
  [NetworkChainID.Ropsten]: {
    name: 'Ropsten Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.RopstenWETH,
      minimumBalanceForAvailability: 0.1,
    },
    fees: defaultFees,
    proxyContract: RailProxyContract.Ropsten,
    deploymentBlock: RailProxyDeploymentBlock.Ropsten,
    fallbackProviderConfig: fallbackProvidersRopsten,
    priceTTLInMS: defaultTokenPriceTTL,
    isTestNetwork: true,
    evmGasType: EVMGasType.Type2,
  },
  [NetworkChainID.BNBSmartChain]: {
    name: 'Binance Smart Chain',
    gasToken: {
      symbol: 'BNB',
      wrappedAddress: GasTokenWrappedAddress.BinanceWBNB,
      minimumBalanceForAvailability: 0.1,
    },
    fees: defaultFees,
    proxyContract: RailProxyContract.BNBSmartChain,
    coingeckoId: CoingeckoNetworkID.BNBSmartChain,
    fallbackProviderConfig: fallbackProvidersBNBSmartChain,
    priceTTLInMS: defaultTokenPriceTTL,
    evmGasType: EVMGasType.Type0,
  },
  [NetworkChainID.PolygonPOS]: {
    name: 'Polygon PoS',
    gasToken: {
      symbol: 'MATIC',
      wrappedAddress: GasTokenWrappedAddress.PolygonWMATIC,
      minimumBalanceForAvailability: 0.1,
    },
    fees: defaultFees,
    proxyContract: RailProxyContract.PolygonPOS,
    coingeckoId: CoingeckoNetworkID.PolygonPOS,
    fallbackProviderConfig: fallbackProvidersPolygon,
    priceTTLInMS: defaultTokenPriceTTL,
    evmGasType: EVMGasType.Type2,
  },
  [NetworkChainID.HardHat]: {
    name: 'HardHat Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.None,
      minimumBalanceForAvailability: 0.1,
    },
    fees: defaultFees,
    proxyContract: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    fallbackProviderConfig: fallbackProvidersHardhat,
    priceTTLInMS: defaultTokenPriceTTL,
    isTestNetwork: true,
    skipQuickScan: true,
    evmGasType: EVMGasType.Type2,
  },
} as NetworksConfig;
