import { ChainType } from '@railgun-community/shared-models';

export enum NetworkChainID {
  Ethereum = 1,
  EthereumGoerli = 5,
  BNBChain = 56,
  PolygonPOS = 137,
  PolygonMumbai = 80001,
  Hardhat = 31337,
}

export const chainTypeToString = (chainType: ChainType): string => {
  switch (chainType) {
    case ChainType.EVM: {
      return 'EVM';
    }
    default: {
      return 'Chain Type Not Defined';
    }
  }
};
