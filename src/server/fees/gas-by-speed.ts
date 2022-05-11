//
// *********************************************
// *********************************************
// *********************************************
// *********************************************
//
//     DANGER  DANGER  DANGER  DANGER  DANGER
//
//
//     DO NOT MODIFY THE LOGIC IN THIS FILE.
//
//     DO NOT MODIFY THE LOGIC IN THIS FILE.
//
//     DO NOT MODIFY THE LOGIC IN THIS FILE.
//
//     DO NOT MODIFY THE LOGIC IN THIS FILE.
//
//
//   This logic comes from private RAILGUN contributor
//   frontend repos, where the logic should be modified instead.
//
//
// *********************************************
// *********************************************
// *********************************************
//

import { BigNumber } from '@ethersproject/bignumber';
import Web3 from 'web3-eth';
import { EVMGasType } from '../../models/network-models';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { web3ProviderFromChainID } from '../providers/web3-providers';

// Hack to get the types to apply correctly.
const Web3Eth = Web3 as unknown as typeof Web3.Eth;

//
// THIS CODE WAS MODIFIED FROM METAMASK (MAY 10 2022):
//
// const PRIORITY_LEVELS = ['low', 'medium', 'high'] as const;
// const PRIORITY_LEVEL_PERCENTILES = [10, 20, 30] as const;
// const SETTINGS_BY_PRIORITY_LEVEL = {
//   low: {
//     percentile: 10 as Percentile,
//     baseFeePercentageMultiplier: new BN(110),
//     priorityFeePercentageMultiplier: new BN(94),
//     minSuggestedMaxPriorityFeePerGas: new BN(1_000_000_000),
//     estimatedWaitTimes: {
//       minWaitTimeEstimate: 15_000,
//       maxWaitTimeEstimate: 30_000,
//     },
//   },
//   medium: {
//     percentile: 20 as Percentile,
//     baseFeePercentageMultiplier: new BN(120),
//     priorityFeePercentageMultiplier: new BN(97),
//     minSuggestedMaxPriorityFeePerGas: new BN(1_500_000_000),
//     estimatedWaitTimes: {
//       minWaitTimeEstimate: 15_000,
//       maxWaitTimeEstimate: 45_000,
//     },
//   },
//   high: {
//     percentile: 30 as Percentile,
//     baseFeePercentageMultiplier: new BN(125),
//     priorityFeePercentageMultiplier: new BN(98),
//     minSuggestedMaxPriorityFeePerGas: new BN(2_000_000_000),
//     estimatedWaitTimes: {
//       minWaitTimeEstimate: 15_000,
//       maxWaitTimeEstimate: 60_000,
//     },
//   },
// };
//

export type GasDetailsBySpeed =
  | NumMapType<{
      evmGasType: EVMGasType.Type0;
      gasPrice: BigNumber;
    }>
  | NumMapType<{
      evmGasType: EVMGasType.Type2;
      maxFeePerGas: BigNumber;
      maxPriorityFeePerGas: BigNumber;
    }>;

enum GasHistoryPercentile {
  Low = 10,
  Medium = 20,
  High = 30,
}

type SuggestedGasDetails = {
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
};

const HISTORICAL_BLOCK_COUNT = 5;
const REWARD_PERCENTILES: number[] = [
  GasHistoryPercentile.Low,
  GasHistoryPercentile.Medium,
  GasHistoryPercentile.High,
];

const SETTINGS_BY_PRIORITY_LEVEL = {
  [GasHistoryPercentile.Low]: {
    baseFeePercentageMultiplier: BigNumber.from(110),
    priorityFeePercentageMultiplier: BigNumber.from(94),
    minSuggestedMaxPriorityFeePerGas: BigNumber.from(1_000_000_000),
  },
  [GasHistoryPercentile.Medium]: {
    baseFeePercentageMultiplier: BigNumber.from(120),
    priorityFeePercentageMultiplier: BigNumber.from(97),
    minSuggestedMaxPriorityFeePerGas: BigNumber.from(1_500_000_000),
  },
  [GasHistoryPercentile.High]: {
    baseFeePercentageMultiplier: BigNumber.from(125),
    priorityFeePercentageMultiplier: BigNumber.from(98),
    minSuggestedMaxPriorityFeePerGas: BigNumber.from(2_000_000_000),
  },
};

const getMedianBigNumber = (feeHistoryOutputs: BigNumber[]): BigNumber => {
  const { length } = feeHistoryOutputs;
  if (length === 0) {
    throw new Error('No fee history outputs');
  }
  const sorted = feeHistoryOutputs.sort((a, b) => {
    return a.sub(b).isNegative() ? -1 : 1;
  });
  // Middle index, rounded down.
  // eg. Should return 2nd item out of 4, 3/5, 3/6 and 4/7, converted to 0-indexed indeces.
  const middleIndex = Math.ceil(length / 2 - 1);
  return sorted[middleIndex];
};

export const getMediumStandardGasDetails = async (chainID: NetworkChainID) => {
  const { evmGasType } = configNetworks[chainID];

  let gasDetailsBySpeed: GasDetailsBySpeed;
  switch (evmGasType) {
    case EVMGasType.Type0:
      gasDetailsBySpeed = await getGasPricesBySpeed(evmGasType, chainID);
      break;
    case EVMGasType.Type2:
      gasDetailsBySpeed = await getMedianHistoricalGasDetailsBySpeed(
        evmGasType,
        chainID,
      );
      break;
  }

  if (!gasDetailsBySpeed) {
    throw new Error('Unhandled gas type.');
  }

  return gasDetailsBySpeed[GasHistoryPercentile.Medium];
};

const gasPriceForPercentile = (
  gasPrice: BigNumber,
  percentile: GasHistoryPercentile,
) => {
  const settings = SETTINGS_BY_PRIORITY_LEVEL[percentile];
  return gasPrice.mul(settings.baseFeePercentageMultiplier).div(100);
};

export const getGasPricesBySpeed = async (
  evmGasType: EVMGasType.Type0,
  chainID: NetworkChainID,
): Promise<GasDetailsBySpeed> => {
  const provider = getProviderForNetwork(chainID);
  const gasPrice = await provider.getGasPrice();

  const gasPricesBySpeed: GasDetailsBySpeed = {
    [GasHistoryPercentile.Low]: {
      evmGasType,
      gasPrice: gasPriceForPercentile(gasPrice, GasHistoryPercentile.Low),
    },
    [GasHistoryPercentile.Medium]: {
      evmGasType,
      gasPrice: gasPriceForPercentile(gasPrice, GasHistoryPercentile.Medium),
    },
    [GasHistoryPercentile.High]: {
      evmGasType,
      gasPrice: gasPriceForPercentile(gasPrice, GasHistoryPercentile.High),
    },
  };

  return gasPricesBySpeed;
};

const getMedianHistoricalGasDetailsBySpeed = async (
  evmGasType: EVMGasType.Type2,
  chainID: NetworkChainID,
): Promise<GasDetailsBySpeed> => {
  const web3Eth = new Web3Eth();
  const provider = web3ProviderFromChainID(chainID);
  web3Eth.setProvider(provider);

  const recentBlock = (await web3Eth.getBlockNumber()) - 1;
  const feeHistory = await web3Eth.getFeeHistory(
    HISTORICAL_BLOCK_COUNT,
    recentBlock,
    REWARD_PERCENTILES,
  );

  const baseFees: BigNumber[] = feeHistory.baseFeePerGas.map((feeHex) =>
    BigNumber.from(feeHex),
  );
  const priorityFeePercentile: NumMapType<BigNumber[]> = {
    [GasHistoryPercentile.Low]: feeHistory.reward.map((feePriorityGroup) =>
      BigNumber.from(feePriorityGroup[0]),
    ),
    [GasHistoryPercentile.Medium]: feeHistory.reward.map((feePriorityGroup) =>
      BigNumber.from(feePriorityGroup[1]),
    ),
    [GasHistoryPercentile.High]: feeHistory.reward.map((feePriorityGroup) =>
      BigNumber.from(feePriorityGroup[2]),
    ),
  };

  const baseFeesMedian: BigNumber = getMedianBigNumber(baseFees);
  const priorityFeePercentileMedians: NumMapType<BigNumber> = {
    [GasHistoryPercentile.Low]: getMedianBigNumber(
      priorityFeePercentile[GasHistoryPercentile.Low],
    ),
    [GasHistoryPercentile.Medium]: getMedianBigNumber(
      priorityFeePercentile[GasHistoryPercentile.Medium],
    ),
    [GasHistoryPercentile.High]: getMedianBigNumber(
      priorityFeePercentile[GasHistoryPercentile.High],
    ),
  };

  const suggestedGasDetails: NumMapType<SuggestedGasDetails> = {
    [GasHistoryPercentile.Low]: getSuggestedGasDetails(
      baseFeesMedian,
      priorityFeePercentileMedians,
      GasHistoryPercentile.Low,
    ),
    [GasHistoryPercentile.Medium]: getSuggestedGasDetails(
      baseFeesMedian,
      priorityFeePercentileMedians,
      GasHistoryPercentile.Medium,
    ),
    [GasHistoryPercentile.High]: getSuggestedGasDetails(
      baseFeesMedian,
      priorityFeePercentileMedians,
      GasHistoryPercentile.High,
    ),
  };

  switch (evmGasType) {
    case EVMGasType.Type2: {
      return {
        [GasHistoryPercentile.Low]: {
          evmGasType,
          ...suggestedGasDetails[GasHistoryPercentile.Low],
        },
        [GasHistoryPercentile.Medium]: {
          evmGasType,
          ...suggestedGasDetails[GasHistoryPercentile.Medium],
        },
        [GasHistoryPercentile.High]: {
          evmGasType,
          ...suggestedGasDetails[GasHistoryPercentile.High],
        },
      };
    }
  }

  throw new Error('Unknown gas type for historical gas estimates');
};

const convertSuggestedGasDetailsToGasPrice = (
  suggestedGasDetails: SuggestedGasDetails,
): BigNumber => {
  return suggestedGasDetails.maxFeePerGas;
};

const maxBigNumber = (b1: BigNumber, b2: BigNumber) => {
  return b1.gt(b2) ? b1 : b2;
};

const getSuggestedGasDetails = (
  baseFeesMedian: BigNumber,
  priorityFeePercentileMedians: NumMapType<BigNumber>,
  percentile: GasHistoryPercentile,
): SuggestedGasDetails => {
  const settings = SETTINGS_BY_PRIORITY_LEVEL[percentile];
  const baseFeePerGas = baseFeesMedian
    .mul(settings.baseFeePercentageMultiplier)
    .div(100);
  const maxPriorityFee = priorityFeePercentileMedians[percentile]
    .mul(settings.priorityFeePercentageMultiplier)
    .div(100);
  return {
    maxPriorityFeePerGas: maxBigNumber(
      maxPriorityFee,
      settings.minSuggestedMaxPriorityFeePerGas,
    ),
    maxFeePerGas: baseFeePerGas.add(maxPriorityFee),
  };
};
