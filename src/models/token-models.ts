import { BigNumber } from 'ethers';

export enum GasTokenWrappedAddress {
  None = 'NO_GAS_TOKEN_ADDRESS',
  EthereumWETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  RopstenWETH = '0xc778417e063141139fce010982780140aa0cd5ab', // (Ropsten) WETH
  BinanceWBNB = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
  PolygonWMATIC = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
}

export type GasTokenConfig = {
  wrappedAddress: GasTokenWrappedAddress | string;
  symbol: string;
  decimals: number;
};

export type TokenConfig = {
  symbol: string;
  decimals: number;
};

export type Token = TokenConfig & {
  address: string;
};

export type TokenAmount = {
  tokenAddress: string;
  amount: BigNumber;
};
