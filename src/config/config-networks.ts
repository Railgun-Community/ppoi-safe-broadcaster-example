import { NetworksConfig } from '../models/config-models';
import { GasTokenWrappedAddress } from '../models/token-models';

// Fallback Provider configs
import configProvidersBinanceSmartChain from './providers/config-providers-binance-smart-chain';
import configProvidersEthereum from './providers/config-providers-ethereum';
import configProvidersHardhat from './providers/config-providers-hardhat';
import configProvidersPolygon from './providers/config-providers-polygon';
import configProvidersRopsten from './providers/config-providers-ropsten';

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
    fallbackProviderConfig: configProvidersEthereum,
  },
  3: {
    name: 'Ropsten Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.EthereumWETH,
      decimals: 18,
    },
    railContract: '0x791532E6155E0F69cEE328B356C8B6A8DaFB9076',
    coingeckoId: 'ethereum',
    fallbackProviderConfig: configProvidersRopsten,
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
    fallbackProviderConfig: configProvidersBinanceSmartChain,
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
    fallbackProviderConfig: configProvidersPolygon,
  },
  31337: {
    name: 'HardHat Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.EthereumWETH,
      decimals: 18,
    },
    railContract: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    coingeckoId: 'ethereum',
    fallbackProviderConfig: configProvidersHardhat,
  },
} as NetworksConfig;
