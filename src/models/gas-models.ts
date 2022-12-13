import { EVMGasType } from '@railgun-community/shared-models';
import { BigNumber } from '@ethersproject/bignumber';

export enum GasHistoryPercentile {
  Low = 10,
  Medium = 20,
  High = 30,
  VeryHigh = 40,
}

export type GasDetails =
  | {
      evmGasType: EVMGasType.Type0 | EVMGasType.Type1;
      gasPrice: BigNumber;
    }
  | {
      evmGasType: EVMGasType.Type2;
      maxFeePerGas: BigNumber;
      maxPriorityFeePerGas: BigNumber;
    };

export type GasDetailsBySpeed = {
  [percentile in GasHistoryPercentile]: GasDetails;
};
