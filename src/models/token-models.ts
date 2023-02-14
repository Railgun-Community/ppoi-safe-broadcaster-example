import { BaseTokenWrappedAddress } from '@railgun-community/shared-models';
import { BigNumber } from 'ethers';

export const GAS_TOKEN_DECIMALS = 18;

export const NO_GAS_TOKEN_ADDRESS = 'NO_GAS_TOKEN_ADDRESS';

export type GasTokenConfig = {
  wrappedAddress: BaseTokenWrappedAddress | string;
  symbol: string;
  decimals: number;
  minBalanceForAvailability: number;
};

export type TokenConfig = {
  symbol: string;
};

export type Token = TokenConfig & {
  address: string;
  decimals: number;
};

export type TokenAmount = {
  tokenAddress: string;
  amount: BigNumber;
};
