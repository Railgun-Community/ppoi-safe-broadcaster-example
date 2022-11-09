import fallbackProvidersEthereum from './fallback-providers/1-ethereum';
import fallbackProvidersEthereumGoerli from './fallback-providers/5-ethereum-goerli';
import fallbackProvidersBNBChain from './fallback-providers/56-binance-smart-chain';
import fallbackProvidersPolygon from './fallback-providers/137-polygon-pos';
import fallbackProvidersPolygonMumbai from './fallback-providers/80001-polygon-mumbai';
import fallbackProvidersHardhat from './fallback-providers/31337-hardhat';
import configFees from './config-fees';
import { CoingeckoNetworkID } from '../../models/api-constants';
import {
  BaseTokenWrappedAddress,
  RailgunProxyContract,
  RelayAdaptContract,
  RailgunProxyDeploymentBlock,
} from '@railgun-community/shared-models';
import { NetworkChainID } from './config-chains';
import { NetworksConfig } from '../../models/config-models';
import { ChainType } from '@railgun-community/engine';
import { NO_GAS_TOKEN_ADDRESS } from '../../models/token-models';

// 10 minute timeout on ticket prices retrieved from API.
// Shorter is safer, but Coingecko free tier can lag by 15-30 minutes.
const defaultTokenPriceTTL = 10 * 60 * 1000;

const networksConfig: NetworksConfig = {
  [ChainType.EVM]: {
    [NetworkChainID.Ethereum]: {
      name: 'Ethereum',
      gasToken: {
        symbol: 'ETH',
        wrappedAddress: BaseTokenWrappedAddress.EthereumWETH,
        decimals: 18,
      },
      fees: configFees,
      proxyContract: RailgunProxyContract.Ethereum,
      relayAdaptContract: RelayAdaptContract.Ethereum,
      deploymentBlock: RailgunProxyDeploymentBlock.Ethereum,
      coingeckoNetworkId: CoingeckoNetworkID.Ethereum,
      fallbackProviderConfig: fallbackProvidersEthereum,
      priceTTLInMS: defaultTokenPriceTTL,
    },
    [NetworkChainID.EthereumGoerli]: {
      name: 'Görli Testnet',
      gasToken: {
        symbol: 'ETH',
        wrappedAddress: BaseTokenWrappedAddress.EthereumGoerliWETH,
        decimals: 18,
      },
      fees: configFees,
      proxyContract: RailgunProxyContract.EthereumGoerli,
      relayAdaptContract: RelayAdaptContract.EthereumGoerli,
      deploymentBlock: RailgunProxyDeploymentBlock.EthereumGoerli,
      fallbackProviderConfig: fallbackProvidersEthereumGoerli,
      priceTTLInMS: defaultTokenPriceTTL,
      isTestNetwork: true,
    },
    [NetworkChainID.BNBChain]: {
      name: 'BNB Chain',
      gasToken: {
        symbol: 'BNB',
        wrappedAddress: BaseTokenWrappedAddress.BinanceWBNB,
        decimals: 18,
      },
      fees: configFees,
      proxyContract: RailgunProxyContract.BNBChain,
      relayAdaptContract: RelayAdaptContract.BNBChain,
      deploymentBlock: RailgunProxyDeploymentBlock.BNBChain,
      coingeckoNetworkId: CoingeckoNetworkID.BNBChain,
      fallbackProviderConfig: fallbackProvidersBNBChain,
      priceTTLInMS: defaultTokenPriceTTL,
    },
    [NetworkChainID.PolygonPOS]: {
      name: 'Polygon PoS',
      gasToken: {
        symbol: 'MATIC',
        wrappedAddress: BaseTokenWrappedAddress.PolygonWMATIC,
        decimals: 18,
      },
      fees: configFees,
      proxyContract: RailgunProxyContract.PolygonPOS,
      relayAdaptContract: RelayAdaptContract.PolygonPOS,
      coingeckoNetworkId: CoingeckoNetworkID.PolygonPOS,
      deploymentBlock: RailgunProxyDeploymentBlock.PolygonPOS,
      fallbackProviderConfig: fallbackProvidersPolygon,
      priceTTLInMS: defaultTokenPriceTTL,
    },
    [NetworkChainID.PolygonMumbai]: {
      name: 'Mumbai Testnet',
      gasToken: {
        symbol: 'MATIC',
        wrappedAddress: BaseTokenWrappedAddress.PolygonMumbaiWMATIC,
        decimals: 18,
      },
      fees: configFees,
      proxyContract: RailgunProxyContract.PolygonMumbai,
      relayAdaptContract: RelayAdaptContract.PolygonMumbai,
      deploymentBlock: RailgunProxyDeploymentBlock.PolygonMumbai,
      fallbackProviderConfig: fallbackProvidersPolygonMumbai,
      priceTTLInMS: defaultTokenPriceTTL,
      isTestNetwork: true,
    },
    [NetworkChainID.Hardhat]: {
      name: 'Hardhat Testnet',
      gasToken: {
        symbol: 'ETH',
        wrappedAddress: NO_GAS_TOKEN_ADDRESS,
        decimals: 18,
      },
      fees: configFees,
      proxyContract: RailgunProxyContract.Hardhat,
      relayAdaptContract: RelayAdaptContract.Hardhat,
      deploymentBlock: RailgunProxyDeploymentBlock.Hardhat,
      fallbackProviderConfig: fallbackProvidersHardhat,
      priceTTLInMS: defaultTokenPriceTTL,
      isTestNetwork: true,
      skipQuickScan: true,
    },
  },
};

export default networksConfig;
