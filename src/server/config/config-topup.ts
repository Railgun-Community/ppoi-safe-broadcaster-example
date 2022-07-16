import { BigNumber } from 'ethers';
import { GAS_TOKEN_DECIMALS } from '../../models/token-models';

export type MinimumBalanceForTopup = {
  amountInGasToken: BigNumber;
};

export default {
  amountInGasToken: BigNumber.from(10).pow(GAS_TOKEN_DECIMALS).mul(3).div(2),
} as MinimumBalanceForTopup;
