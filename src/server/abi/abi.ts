import {
  ABIRailgunSmartWallet,
  ABIRelayAdapt,
  ChainType,
} from '@railgun-community/engine';
import { RelayerChain } from '../../models/chain-models';
import { NetworkChainID } from '../config/config-chains';
import ABI_ERC20 from './json/erc20.json';
import ZERO_X_ABI from './json/zerox.json';

export const abiForProxyContract = () => {
  return ABIRailgunSmartWallet;
};

export const abiForRelayAdaptContract = () => {
  return ABIRelayAdapt;
};

export const zeroXAbiForChain = (chain: RelayerChain): Array<any> => {
  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Ethereum:
        case NetworkChainID.EthereumGoerli:
        case NetworkChainID.BNBChain:
        case NetworkChainID.PolygonPOS:
        case NetworkChainID.PolygonMumbai:
          return ZERO_X_ABI;
        case NetworkChainID.ArbitrumGoerli:
        case NetworkChainID.Hardhat:
          throw new Error(
            `0x API not available on chain ${chain.type}:${chain.id}`,
          );
      }
    }
  }
};

export const abiForChainToken = (chain: RelayerChain): Array<any> => {
  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Ethereum:
        case NetworkChainID.EthereumGoerli:
        case NetworkChainID.BNBChain:
        case NetworkChainID.PolygonPOS:
        case NetworkChainID.PolygonMumbai:
        case NetworkChainID.ArbitrumGoerli:
        case NetworkChainID.Hardhat:
          return ABI_ERC20;
      }
    }
  }
};
