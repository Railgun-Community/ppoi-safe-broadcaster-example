import ABI_RAILGUN_LOGIC from '@railgun-community/lepton/dist/abi/RailgunLogic.json';
import ABI_RELAY_ADAPT from '@railgun-community/lepton/dist/abi/RelayAdapt.json';
import { NetworkChainID } from '../config/config-chain-ids';
import ABI_ERC20 from './json/erc20.json';

export const abiForProxyContract = () => {
  return ABI_RAILGUN_LOGIC;
};

export const abiForRelayAdaptContract = () => {
  return ABI_RELAY_ADAPT;
};

export const abiForChainToken = (chainID: NetworkChainID): Array<any> => {
  switch (chainID) {
    case NetworkChainID.Ethereum: {
      return ABI_ERC20;
    }
    case NetworkChainID.BNBSmartChain: {
      return ABI_ERC20;
    }
    case NetworkChainID.PolygonPOS: {
      return ABI_ERC20;
    }
    case NetworkChainID.Ropsten: {
      return ABI_ERC20;
    }
    case NetworkChainID.HardHat: {
      return ABI_ERC20;
    }
    default: {
      throw new Error(`Unimplemented: ABI for chain ${chainID}`);
    }
  }
};
