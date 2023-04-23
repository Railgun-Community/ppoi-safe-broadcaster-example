import { BaseProvider, JsonRpcProvider } from '@ethersproject/providers';
import configTokens from '../server/config/config-tokens';
import { CoingeckoNetworkID } from '../models/api-constants';
import {
  BaseTokenWrappedAddress,
  RailgunProxyContract,
  RelayAdaptContract,
} from '@railgun-community/shared-models';
import { Network, PaymasterContractAddress } from '../models/network-models';
import { Token, TokenConfig } from '../models/token-models';
import { RelayerChain } from '../models/chain-models';
import fallbackProvidersEthereum from '../server/config/fallback-providers/1-ethereum';
import fallbackProvidersGoerli from '../server/config/fallback-providers/5-ethereum-goerli';
import fallbackProvidersHardhat from '../server/config/fallback-providers/31337-hardhat';
import { PopulatedTransaction } from '@ethersproject/contracts';

export const mockTokenConfig = (chain: RelayerChain, tokenAddress: string) => {
  // @ts-ignore
  configTokens[chain.type] ??= {};
  configTokens[chain.type][chain.id] ??= {};
  configTokens[chain.type][chain.id][tokenAddress] = {
    symbol: tokenAddress.toUpperCase(),
  };
};

export const MOCK_TOKEN_6_DECIMALS = '0x03738239';

export const getMockProvider = (): BaseProvider => {
  return new BaseProvider({ name: 'Ethereum', chainId: 1 });
};

export const getMockEthereumNetwork = (): Network => {
  return {
    name: 'Ethereum',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: BaseTokenWrappedAddress.EthereumWETH,
      decimals: 18,
      minBalanceForAvailability: 0.1,
    },
    fees: {
      gasEstimateVarianceBuffer: 0.03,
      gasEstimateLimitToActualRatio: 1.25,
      profit: 0.07,
    },
    proxyContract: '0x00' as RailgunProxyContract,
    relayAdaptContract: '0x00' as RelayAdaptContract,
    paymasterContract: PaymasterContractAddress.Ethereum,
    coingeckoNetworkId: CoingeckoNetworkID.Ethereum,
    fallbackProviderConfig: fallbackProvidersEthereum,
    priceTTLInMS: 5 * 60 * 1000,
  };
};

export const getMockGoerliNetwork = (): Network => {
  return {
    name: 'Görli Testnet',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: '0x00',
      decimals: 18,
      minBalanceForAvailability: 0.1,
    },
    fees: {
      gasEstimateVarianceBuffer: 0.05,
      gasEstimateLimitToActualRatio: 1.25,
      profit: 0.05,
    },
    proxyContract: RailgunProxyContract.EthereumGoerli,
    relayAdaptContract: RelayAdaptContract.EthereumGoerli,
    paymasterContract: PaymasterContractAddress.EthereumGoerli,
    fallbackProviderConfig: fallbackProvidersGoerli,
    priceTTLInMS: 5 * 60 * 1000,
    isTestNetwork: true,
  };
};

export const getMockHardhatNetwork = (): Network => {
  return {
    name: 'Hardhat',
    gasToken: {
      symbol: 'ETH',
      wrappedAddress: '0x00',
      decimals: 18,
      minBalanceForAvailability: 0.1,
    },
    fees: {
      gasEstimateVarianceBuffer: 0.03,
      gasEstimateLimitToActualRatio: 1.25,
      profit: 0.07,
    },
    proxyContract: RailgunProxyContract.Hardhat,
    relayAdaptContract: RelayAdaptContract.Hardhat,
    paymasterContract: PaymasterContractAddress.Hardhat,
    fallbackProviderConfig: fallbackProvidersHardhat,
    priceTTLInMS: 5 * 60 * 1000,
    isTestNetwork: true,
  };
};

export const getJsonRPCProviderHardhat = () => {
  return new JsonRpcProvider(fallbackProvidersHardhat.providers[0].provider);
};

export const getMockPopulatedTransaction = (): PopulatedTransaction => {
  return {};
};

export const getMockSerializedTransaction = (): string => {
  return JSON.stringify(getMockPopulatedTransaction());
};

export const getMockTokenConfig = (): TokenConfig => {
  return {
    symbol: 'SHIB',
  };
};

export const getMockToken = (): Token => {
  return {
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    symbol: 'SHIB',
    decimals: 18,
  };
};

export const getMockWalletAddress = (): string => {
  // Vitalik public address
  return '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
};

export const MOCK_BOUND_PARAMS = {
  commitmentCiphertext: [
    {
      ciphertext: [
        '0x7d6854cd1fc49f0602ccd933422ed2e2ee070a9f1806843d5c81c08253134950',
        '0x8f54329134103720a7dac44d6f2a632ff18e7599b9bc1bf39d639e998a223b80',
        '0xed1ec36daf72e389fc567b2b5507fb6bff80b601bd3c0c441e4e97f28551f2f2',
        '0xede74ef3a06347178de5e4204f6bf8c475be62bcdb9911bd31be952f2e8af096',
      ],
      blindedSenderViewingKey:
        '0x898bc07d416014a2854f756b9f8873bde925b043e9e01ea6d97183b91217b5b6',
      blindedReceiverViewingKey:
        '0x898bc07d416014a2854f756b9f8873bde925b043e9e01ea6d97183b91217b5b6',
      memo: '0x',
      annotationData:
        '0xfaeb57df19481f9ad59b8619a5687b2623aa2280d0df93aa77258326df9e6657bbdb72d305e1373906a47c6e684c34c2553c7e061baac1f744e8ece042c6',
    },
  ],
};

export const MOCK_COMMITMENT_HASH =
  '0x2b13bccd4974c797df42a89221ed6e19e50c32055058cdcc5a8ea836233e4cab';

// Hardhat TESTERC20
export const MOCK_RELAYER_FEE_TOKEN_ADDRESS =
  '0x5FbDB2315678afecb367f032d93F642f64180aa3';
