import { BaseTokenWrappedAddress } from './token-models';

export interface Network {
  name: string;
  gasToken: string;
  gasTokenWrappedAddress: BaseTokenWrappedAddress;
  gasTokenDecimals: number;
  railContract: string;
  coingeckoId: string;
}
