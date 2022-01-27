import { GasTokenWrappedAddress } from '../models/token-models';

// Fallback Provider configs
import fallbackProvidersEthereum from './fallback-providers/1-ethereum';
import fallbackProvidersRopsten from './fallback-providers/3-ropsten';
import fallbackProvidersBinanceSmartChain from './fallback-providers/56-binance-smart-chain';
import fallbackProvidersPolygon from './fallback-providers/137-polygon';
import fallbackProvidersHardhat from './fallback-providers/31337-hardhat';
import { CoingeckoNetworkID } from '../models/api-constants';
import { RailProxyContract } from '../models/contract-constants';
import { NetworkChainID } from './config-chain-ids';
import { NetworksConfig } from '../models/config-models';

const defaultFees = {
  slippageBuffer: 0.05,
  profit: 0.05,
};

export default {
  [NetworkChainID.Ethereum]: {
    name: 'Ethereum',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.EthereumWETH,
      decimals: 18,
    },
    fees: defaultFees,
    railContract: RailProxyContract.Ethereum,
    coingeckoId: CoingeckoNetworkID.Ethereum,
    fallbackProviderConfig: fallbackProvidersEthereum,
    priceTTLInMS: 5 * 60 * 1000,
  },
  [NetworkChainID.Ropsten]: {
    name: 'Ropsten Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.RopstenWETH,
      decimals: 18,
    },
    fees: defaultFees,
    railContract: RailProxyContract.Ropsten,
    fallbackProviderConfig: fallbackProvidersRopsten,
    priceTTLInMS: 5 * 60 * 1000,
  },
  [NetworkChainID.BinanceSmartChain]: {
    name: 'Binance Smart Chain',
    gasToken: {
      symbol: 'BNB',
      wrappedAddress: GasTokenWrappedAddress.BinanceWBNB,
      decimals: 18,
    },
    fees: defaultFees,
    railContract: RailProxyContract.BinanceSmartChain,
    coingeckoId: CoingeckoNetworkID.BinanceSmartChain,
    fallbackProviderConfig: fallbackProvidersBinanceSmartChain,
    priceTTLInMS: 5 * 60 * 1000,
  },
  [NetworkChainID.PolygonPOS]: {
    name: 'Polygon PoS',
    gasToken: {
      symbol: 'MATIC',
      wrappedAddress: GasTokenWrappedAddress.PolygonWMATIC,
      decimals: 18,
    },
    fees: defaultFees,
    railContract: RailProxyContract.PolygonPOS,
    coingeckoId: CoingeckoNetworkID.PolygonPOS,
    fallbackProviderConfig: fallbackProvidersPolygon,
    priceTTLInMS: 5 * 60 * 1000,
  },
  [NetworkChainID.HardHat]: {
    name: 'HardHat Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.None,
      decimals: 18,
    },
    fees: defaultFees,
    railContract: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    fallbackProviderConfig: fallbackProvidersHardhat,
    priceTTLInMS: 5 * 60 * 1000,
  },
} as NetworksConfig;
