import { NetworkChainID } from '../../config/config-chain-ids';
import ABI_ERC20 from './erc20.json';

export const abiForChain = (chainID: NetworkChainID) => {
  switch (chainID) {
    case NetworkChainID.Ethereum: {
      return ABI_ERC20;
    }
    case NetworkChainID.BinanceSmartChain: {
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
