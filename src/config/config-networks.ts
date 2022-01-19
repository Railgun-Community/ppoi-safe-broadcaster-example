import { NetworksConfig } from '../models/config-models';
import { GasTokenWrappedAddress } from '../models/token-models';

// Fallback Provider configs
import fallbackProvidersEthereum from './fallback-providers/1-ethereum';
import fallbackProvidersRopsten from './fallback-providers/3-ropsten';
import fallbackProvidersBinanceSmartChain from './fallback-providers/56-binance-smart-chain';
import fallbackProvidersPolygon from './fallback-providers/137-polygon';
import fallbackProvidersHardhat from './fallback-providers/31337-hardhat';
import { CoingeckoID } from '../models/api-constants';
import { RailProxyContract } from '../models/contract-constants';

export default {
  1: {
    name: 'Ethereum',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.EthereumWETH,
      decimals: 18,
    },
    railContract: RailProxyContract.Ethereum,
    coingeckoId: CoingeckoID.Ethereum,
    fallbackProviderConfig: fallbackProvidersEthereum,
  },
  3: {
    name: 'Ropsten Test Network',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: GasTokenWrappedAddress.RopstenWETH,
      decimals: 18,
    },
    railContract: RailProxyContract.Ropsten,
    fallbackProviderConfig: fallbackProvidersRopsten,
  },
  56: {
    name: 'Binance Smart Chain',
    gasToken: {
      symbol: 'BNB',
      wrappedAddress: GasTokenWrappedAddress.BinanceWBNB,
      decimals: 18,
    },
    railContract: RailProxyContract.BinanceSmartChain,
    coingeckoId: CoingeckoID.BinanceSmartChain,
    fallbackProviderConfig: fallbackProvidersBinanceSmartChain,
  },
  137: {
    name: 'Polygon PoS',
    gasToken: {
      symbol: 'MATIC',
      wrappedAddress: GasTokenWrappedAddress.PolygonWMATIC,
      decimals: 18,
    },
    railContract: RailProxyContract.PolygonPOS,
    coingeckoId: CoingeckoID.PolygonPOS,
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
