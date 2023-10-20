import fallbackProvidersEthereum from './fallback-providers/1-ethereum';
import fallbackProvidersEthereumGoerli from './fallback-providers/5-ethereum-goerli';
import fallbackProvidersBNBChain from './fallback-providers/56-binance-smart-chain';
import fallbackProvidersPolygon from './fallback-providers/137-polygon-pos';
import fallbackProvidersArbitrum from './fallback-providers/42161-arbitrum';
import fallbackProvidersPolygonMumbai from './fallback-providers/80001-polygon-mumbai';
import fallbackProvidersHardhat from './fallback-providers/31337-hardhat';
import fallbackProvidersArbitrumGoerli from './fallback-providers/421613-arbitrum-goerli';
import fallbackProvidersEthereumSepolia from './fallback-providers/11155111-ethereum-sepolia';
import { feeConfigL1, feeConfigL2 } from './config-fees';
import { CoingeckoNetworkID } from '../../models/api-constants';
import {
  ChainType,
  NETWORK_CONFIG,
  NetworkName,
} from '@railgun-community/shared-models';
import { NetworkChainID } from './config-chains';
import { NetworksConfig } from '../../models/config-models';
import {
  GAS_TOKEN_DECIMALS,
  NO_GAS_TOKEN_ADDRESS,
} from '../../models/token-models';
import { parseUnits } from 'ethers';

const tokenValue = (value: number) => {
  return parseUnits(String(value), GAS_TOKEN_DECIMALS);
};

const QUARTER_TOKEN = tokenValue(0.25);

const HALF_TOKEN = tokenValue(0.5);

const ONE_TOKEN = tokenValue(1);

const ONE_AND_HALF = tokenValue(1.5);

const FIVE_TOKENS = tokenValue(5);

const TEN_TOKENS = tokenValue(10);

// 0.15 ETH minimum for L1 availability.
const MINIMUM_BALANCE_FOR_AVAILABILITY_L1 = 0.15;
// 0.01 ETH minimum for L2 availability.
const MINIMUM_BALANCE_FOR_AVAILABILITY_L2 = 0.01;

// 10 minute timeout on ticket prices retrieved from API.
// Shorter is safer, but Coingecko free tier can lag by 15-30 minutes.
const defaultTokenPriceTTL = 10 * 60 * 1000;

const networksConfig: NetworksConfig = {
  [ChainType.EVM]: {
    [NetworkChainID.Ethereum]: {
      name: 'Ethereum',
      gasToken: {
        symbol: 'ETH',
        wrappedAddress:
          NETWORK_CONFIG[NetworkName.Ethereum].baseToken.wrappedAddress,
        decimals: 18n,
        minBalanceForAvailability: MINIMUM_BALANCE_FOR_AVAILABILITY_L1,
      },
      fees: feeConfigL1(1.25),
      proxyContract: NETWORK_CONFIG[NetworkName.Ethereum].proxyContract,
      relayAdaptContract:
        NETWORK_CONFIG[NetworkName.Ethereum].relayAdaptContract,
      deploymentBlock: NETWORK_CONFIG[NetworkName.Ethereum].deploymentBlock,
      coingeckoNetworkId: CoingeckoNetworkID.Ethereum,
      fallbackProviderConfig: fallbackProvidersEthereum,
      priceTTLInMS: defaultTokenPriceTTL,
      retryGasBuffer: parseUnits('0.1', 'gwei'),
      topUp: {
        allowMultiTokenTopUp: true,
        accumulateNativeToken: true,
        toleratedSlippage: 0.01,
        maxSpendPercentage: 0.05,
        swapThresholdIntoGasToken: ONE_AND_HALF,
        minimumGasBalanceForTopup: HALF_TOKEN,
      },
    },
    [NetworkChainID.EthereumGoerli]: {
      name: 'Görli Testnet',
      gasToken: {
        symbol: 'ETH',
        wrappedAddress:
          NETWORK_CONFIG[NetworkName.EthereumGoerli].baseToken.wrappedAddress,
        decimals: 18n,
        minBalanceForAvailability: MINIMUM_BALANCE_FOR_AVAILABILITY_L1,
      },
      fees: feeConfigL1(1.25),
      proxyContract: NETWORK_CONFIG[NetworkName.EthereumGoerli].proxyContract,
      relayAdaptContract:
        NETWORK_CONFIG[NetworkName.EthereumGoerli].relayAdaptContract,
      deploymentBlock:
        NETWORK_CONFIG[NetworkName.EthereumGoerli].deploymentBlock,
      fallbackProviderConfig: fallbackProvidersEthereumGoerli,
      priceTTLInMS: defaultTokenPriceTTL,
      topUp: {
        allowMultiTokenTopUp: true,
        accumulateNativeToken: true,
        toleratedSlippage: 0.01,
        maxSpendPercentage: 0.05,
        swapThresholdIntoGasToken: ONE_AND_HALF,
        minimumGasBalanceForTopup: HALF_TOKEN,
      },
      retryGasBuffer: parseUnits('0.1', 'gwei'),

      isTestNetwork: true,
    },
    [NetworkChainID.BNBChain]: {
      name: 'BNB Chain',
      gasToken: {
        symbol: 'BNB',
        wrappedAddress:
          NETWORK_CONFIG[NetworkName.BNBChain].baseToken.wrappedAddress,
        decimals: 18n,
        minBalanceForAvailability: MINIMUM_BALANCE_FOR_AVAILABILITY_L1,
      },
      fees: feeConfigL1(1.2),
      proxyContract: NETWORK_CONFIG[NetworkName.BNBChain].proxyContract,
      relayAdaptContract:
        NETWORK_CONFIG[NetworkName.BNBChain].relayAdaptContract,
      deploymentBlock: NETWORK_CONFIG[NetworkName.BNBChain].deploymentBlock,
      coingeckoNetworkId: CoingeckoNetworkID.BNBChain,
      fallbackProviderConfig: fallbackProvidersBNBChain,
      priceTTLInMS: defaultTokenPriceTTL,
      topUp: {
        allowMultiTokenTopUp: true,
        accumulateNativeToken: true,
        toleratedSlippage: 0.01,
        maxSpendPercentage: 0.05,
        swapThresholdIntoGasToken: HALF_TOKEN,
        minimumGasBalanceForTopup: HALF_TOKEN,
      },
      retryGasBuffer: parseUnits('0.1', 'gwei'),
    },
    [NetworkChainID.PolygonPOS]: {
      name: 'Polygon PoS',
      gasToken: {
        symbol: 'MATIC',
        wrappedAddress:
          NETWORK_CONFIG[NetworkName.Polygon].baseToken.wrappedAddress,
        decimals: 18n,
        minBalanceForAvailability: MINIMUM_BALANCE_FOR_AVAILABILITY_L1,
      },
      fees: feeConfigL1(1.15),
      proxyContract: NETWORK_CONFIG[NetworkName.Polygon].proxyContract,
      relayAdaptContract:
        NETWORK_CONFIG[NetworkName.Polygon].relayAdaptContract,
      deploymentBlock: NETWORK_CONFIG[NetworkName.Polygon].deploymentBlock,
      coingeckoNetworkId: CoingeckoNetworkID.PolygonPOS,
      fallbackProviderConfig: fallbackProvidersPolygon,
      priceTTLInMS: defaultTokenPriceTTL,
      topUp: {
        allowMultiTokenTopUp: true,
        accumulateNativeToken: true,
        toleratedSlippage: 0.01,
        maxSpendPercentage: 0.05,
        swapThresholdIntoGasToken: TEN_TOKENS,
        minimumGasBalanceForTopup: FIVE_TOKENS,
      },
      retryGasBuffer: parseUnits('1', 'gwei'),
    },
    [NetworkChainID.Arbitrum]: {
      name: 'Arbitrum',
      gasToken: {
        symbol: 'ETH',
        wrappedAddress:
          NETWORK_CONFIG[NetworkName.Arbitrum].baseToken.wrappedAddress,
        decimals: 18n,
        minBalanceForAvailability: MINIMUM_BALANCE_FOR_AVAILABILITY_L2,
      },
      fees: feeConfigL2(1.5),
      proxyContract: NETWORK_CONFIG[NetworkName.Arbitrum].proxyContract,
      relayAdaptContract:
        NETWORK_CONFIG[NetworkName.Arbitrum].relayAdaptContract,
      deploymentBlock: NETWORK_CONFIG[NetworkName.Arbitrum].deploymentBlock,
      coingeckoNetworkId: CoingeckoNetworkID.Arbitrum,
      fallbackProviderConfig: fallbackProvidersArbitrum,
      priceTTLInMS: defaultTokenPriceTTL,
      topUp: {
        allowMultiTokenTopUp: true,
        accumulateNativeToken: true,
        toleratedSlippage: 0.01,
        maxSpendPercentage: 0.15,
        swapThresholdIntoGasToken: QUARTER_TOKEN / 2n,
        minimumGasBalanceForTopup: ONE_TOKEN / 20n, // 1/20th = 0.05
      },
      retryGasBuffer: parseUnits('0.1', 'gwei'),
    },
    [NetworkChainID.PolygonMumbai]: {
      name: 'Mumbai Testnet',
      gasToken: {
        symbol: 'MATIC',
        wrappedAddress:
          NETWORK_CONFIG[NetworkName.PolygonMumbai].baseToken.wrappedAddress,
        decimals: 18n,
        minBalanceForAvailability: MINIMUM_BALANCE_FOR_AVAILABILITY_L1,
      },
      fees: feeConfigL1(1.15),
      proxyContract: NETWORK_CONFIG[NetworkName.PolygonMumbai].proxyContract,
      relayAdaptContract:
        NETWORK_CONFIG[NetworkName.PolygonMumbai].relayAdaptContract,
      deploymentBlock:
        NETWORK_CONFIG[NetworkName.PolygonMumbai].deploymentBlock,
      fallbackProviderConfig: fallbackProvidersPolygonMumbai,
      priceTTLInMS: defaultTokenPriceTTL,
      topUp: {
        allowMultiTokenTopUp: true,
        accumulateNativeToken: true,
        toleratedSlippage: 0.01,
        maxSpendPercentage: 0.05,
        swapThresholdIntoGasToken: TEN_TOKENS,
        minimumGasBalanceForTopup: FIVE_TOKENS,
      },
      retryGasBuffer: parseUnits('1', 'gwei'),

      isTestNetwork: true,
    },
    [NetworkChainID.ArbitrumGoerli]: {
      name: 'Arbitrum Görli Testnet',
      gasToken: {
        symbol: 'ETH',
        wrappedAddress:
          NETWORK_CONFIG[NetworkName.ArbitrumGoerli].baseToken.wrappedAddress,
        decimals: 18n,
        minBalanceForAvailability: MINIMUM_BALANCE_FOR_AVAILABILITY_L2,
      },
      fees: feeConfigL2(1.5),
      proxyContract: NETWORK_CONFIG[NetworkName.ArbitrumGoerli].proxyContract,
      relayAdaptContract:
        NETWORK_CONFIG[NetworkName.ArbitrumGoerli].relayAdaptContract,
      deploymentBlock:
        NETWORK_CONFIG[NetworkName.ArbitrumGoerli].deploymentBlock,
      fallbackProviderConfig: fallbackProvidersArbitrumGoerli,
      priceTTLInMS: defaultTokenPriceTTL,
      topUp: {
        allowMultiTokenTopUp: true,
        accumulateNativeToken: true,
        toleratedSlippage: 0.01,
        maxSpendPercentage: 0.05,
        swapThresholdIntoGasToken: QUARTER_TOKEN / 2n,
        minimumGasBalanceForTopup: ONE_TOKEN / 20n, // 1/20th = 0.05
      },
      retryGasBuffer: parseUnits('0.1', 'gwei'),
      isTestNetwork: true,
    },
    [NetworkChainID.Hardhat]: {
      name: 'Hardhat Testnet',
      gasToken: {
        symbol: 'ETH',
        wrappedAddress: NO_GAS_TOKEN_ADDRESS,
        decimals: 18n,
        minBalanceForAvailability: MINIMUM_BALANCE_FOR_AVAILABILITY_L1,
      },
      fees: feeConfigL1(1.25),
      proxyContract: NETWORK_CONFIG[NetworkName.Hardhat].proxyContract,
      relayAdaptContract:
        NETWORK_CONFIG[NetworkName.Hardhat].relayAdaptContract,
      deploymentBlock: NETWORK_CONFIG[NetworkName.Hardhat].deploymentBlock,
      fallbackProviderConfig: fallbackProvidersHardhat,
      priceTTLInMS: defaultTokenPriceTTL,
      topUp: {
        allowMultiTokenTopUp: true,
        accumulateNativeToken: true,
        toleratedSlippage: 0.01,
        maxSpendPercentage: 0.05,
        swapThresholdIntoGasToken: ONE_AND_HALF,
        minimumGasBalanceForTopup: HALF_TOKEN,
      },
      retryGasBuffer: parseUnits('0.1', 'gwei'),
      isTestNetwork: true,
      skipQuickScan: true,
    },
    [NetworkChainID.EthereumSepolia]: {
      name: 'Sepolia Testnet',
      gasToken: {
        symbol: 'ETH',
        wrappedAddress:
          NETWORK_CONFIG[NetworkName.EthereumSepolia].baseToken.wrappedAddress,
        decimals: 18n,
        minBalanceForAvailability: MINIMUM_BALANCE_FOR_AVAILABILITY_L1,
      },
      fees: feeConfigL1(1.25),
      proxyContract: NETWORK_CONFIG[NetworkName.EthereumSepolia].proxyContract,
      relayAdaptContract:
        NETWORK_CONFIG[NetworkName.EthereumSepolia].relayAdaptContract,
      deploymentBlock:
        NETWORK_CONFIG[NetworkName.EthereumSepolia].deploymentBlock,
      fallbackProviderConfig: fallbackProvidersEthereumSepolia,
      priceTTLInMS: defaultTokenPriceTTL,
      topUp: {
        allowMultiTokenTopUp: true,
        accumulateNativeToken: true,
        toleratedSlippage: 0.01,
        maxSpendPercentage: 0.05,
        swapThresholdIntoGasToken: ONE_AND_HALF,
        minimumGasBalanceForTopup: HALF_TOKEN,
      },
      retryGasBuffer: parseUnits('0.1', 'gwei'),
      isTestNetwork: true,
    },
  },
};

export default networksConfig;
