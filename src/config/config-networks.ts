import { NetworksConfig } from '../models/config-models';
import { GasTokenWrappedAddress } from '../models/token-models';

// Fallback Provider configs
import fallbackProvidersEthereum from './fallback-providers/1-ethereum';
import fallbackProvidersRopsten from './fallback-providers/3-ropsten';
import fallbackProvidersBinanceSmartChain from './fallback-providers/56-binance-smart-chain';
import fallbackProvidersPolygon from './fallback-providers/137-polygon';
import fallbackProvidersHardhat from './fallback-providers/31337-hardhat';

export default {
  1: {
    name: 'Ethereum',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.EthereumWETH,
      decimals: 18,
    },
    railContract: '0xbf0Af567D60318f66460Ec78b464589E3f9dA48e',
    coingeckoId: 'ethereum',
    fallbackProviderConfig: fallbackProvidersEthereum,
  },
  3: {
    name: 'Ropsten Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.RopstenWETH,
      decimals: 18,
    },
    railContract: '0x791532E6155E0F69cEE328B356C8B6A8DaFB9076',
    fallbackProviderConfig: fallbackProvidersRopsten,
  },
  56: {
    name: 'Binance Smart Chain',
    gasToken: {
      symbol: 'BNB',
      wrappedAddress: GasTokenWrappedAddress.BinanceWBNB,
      decimals: 18,
    },
    railContract: '', // TODO
    coingeckoId: 'binance-smart-chain',
    fallbackProviderConfig: fallbackProvidersBinanceSmartChain,
  },
  137: {
    name: 'Polygon PoS',
    gasToken: {
      symbol: 'MATIC',
      wrappedAddress: GasTokenWrappedAddress.PolygonWMATIC,
      decimals: 18,
    },
    railContract: '', // TODO
    coingeckoId: 'polygon-pos',
    fallbackProviderConfig: fallbackProvidersPolygon,
  },
  31337: {
    name: 'HardHat Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.None,
      decimals: 18,
    },
    railContract: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    fallbackProviderConfig: fallbackProvidersHardhat,
  },
} as NetworksConfig;
