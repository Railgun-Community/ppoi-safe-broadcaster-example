import { NetworksConfig } from '../models/config-models';
import { Network } from '../models/network-models';
import { BaseTokenWrappedAddress } from '../models/token-models';

const networks: NumMapType<Network> = {
  1: {
    name: 'Ethereum',
    gasToken: 'ETH',
    gasTokenWrappedAddress: BaseTokenWrappedAddress.EthereumWETH,
    gasTokenDecimals: 18,
    railContract: '0xbf0Af567D60318f66460Ec78b464589E3f9dA48e',
    coingeckoId: 'ethereum',
  },
  3: {
    name: 'Ropsten Test Network',
    gasTokenWrappedAddress: BaseTokenWrappedAddress.EthereumWETH,
    gasTokenDecimals: 18,
    gasToken: 'ETH',
    railContract: '0x791532E6155E0F69cEE328B356C8B6A8DaFB9076',
    coingeckoId: 'ethereum',
  },
  56: {
    name: 'Binance Smart Chain',
    gasToken: 'BNB',
    gasTokenWrappedAddress: BaseTokenWrappedAddress.BinanceWBNB,
    gasTokenDecimals: 18,
    railContract: '', // TODO
    coingeckoId: 'binance-smart-chain',
  },
  137: {
    name: 'Polygon PoS',
    gasToken: 'MATIC',
    gasTokenWrappedAddress: BaseTokenWrappedAddress.PolygonWMATIC,
    gasTokenDecimals: 18,
    railContract: '', // TODO
    coingeckoId: 'polygon-pos',
  },
  31337: {
    name: 'HardHat Test Network',
    gasTokenWrappedAddress: BaseTokenWrappedAddress.EthereumWETH,
    gasTokenDecimals: 18,
    gasToken: 'ETH',
    railContract: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    coingeckoId: 'ethereum',
  },
};

export default {
  networks,
} as NetworksConfig;
