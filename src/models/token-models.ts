import { BaseTokenWrappedAddress } from '@railgun-community/shared-models';

export const GAS_TOKEN_DECIMALS = 18n;

export const NO_GAS_TOKEN_ADDRESS = 'NO_GAS_TOKEN_ADDRESS';

export type GasTokenConfig = {
  wrappedAddress: BaseTokenWrappedAddress | string;
  symbol: string;
  decimals: bigint;
  minBalanceForAvailability: number;
};

export type TokenConfig = {
  symbol: string;
};

export type Token = TokenConfig & {
  address: string;
  decimals: bigint;
};

export type ERC20Amount = {
  tokenAddress: string;
  amount: bigint;
};
