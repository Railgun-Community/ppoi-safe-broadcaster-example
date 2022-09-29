import ABI_RAILGUN_LOGIC from '@railgun-community/engine/dist/abi/RailgunLogic.json';
import ABI_RELAY_ADAPT from '@railgun-community/engine/dist/abi/RelayAdapt.json';
import { ChainType } from '@railgun-community/engine/dist/models/engine-types';
import { RelayerChain } from '../../models/chain-models';
import { NetworkChainID } from '../config/config-chains';
import ABI_ERC20 from './json/erc20.json';
import ZERO_X_ABI from './json/zerox.json';

export const abiForProxyContract = () => {
  return ABI_RAILGUN_LOGIC;
};

export const abiForRelayAdaptContract = () => {
  return ABI_RELAY_ADAPT;
};

export const zeroXAbiForChain = (chain: RelayerChain): Array<any> => {
  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Ethereum:
        case NetworkChainID.BNBSmartChain:
        case NetworkChainID.PolygonPOS:
        case NetworkChainID.Ropsten:
        case NetworkChainID.HardHat:
          return ZERO_X_ABI;
      }
    }
  }
};

export const abiForChainToken = (chain: RelayerChain): Array<any> => {
  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Ethereum:
        case NetworkChainID.BNBSmartChain:
        case NetworkChainID.PolygonPOS:
        case NetworkChainID.Ropsten:
        case NetworkChainID.HardHat:
          return ABI_ERC20;
      }
    }
  }
};
