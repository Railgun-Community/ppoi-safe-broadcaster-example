import { NetworksConfig } from '../models/config-models';
import { GasTokenWrappedAddress } from '../models/token-models';

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
  },
} as NetworksConfig;
