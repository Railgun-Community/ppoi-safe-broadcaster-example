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
// *********************************************
// *********************************************
// *********************************************
//

import { ChainType, EVMGasType } from '@railgun-community/shared-models';
import { RelayerChain } from '../../models/chain-models';
import {
  GasHistoryPercentile,
  GasDetailsBySpeed,
  GasDetails,
} from '../../models/gas-models';
import { maxBigInt, minBigInt } from '../../util/utils';
import {
  getGasDetailsBySpeedBlockNative,
  supportsBlockNativeGasEstimates,
} from '../api/block-native/gas-by-speed-block-native';
import { NetworkChainID } from '../config/config-chains';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getFeeHistory } from './gas-fee-history';

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

type SuggestedGasDetails = {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

// WARNING: TRANSACTIONS RISK BEING REVERTED IF YOU MODIFY THIS.
const SETTINGS_BY_PRIORITY_LEVEL = {
  [GasHistoryPercentile.Low]: {
    baseFeePercentageMultiplier: BigInt(125),
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(1_500_000_000),
  },
  [GasHistoryPercentile.Medium]: {
    baseFeePercentageMultiplier: BigInt(180),
    priorityFeePercentageMultiplier: BigInt(110),
    minSuggestedMaxPriorityFeePerGas: BigInt(2_500_000_000),
  },
  [GasHistoryPercentile.High]: {
    baseFeePercentageMultiplier: BigInt(250),
    priorityFeePercentageMultiplier: BigInt(125),
    minSuggestedMaxPriorityFeePerGas: BigInt(3_000_000_000),
  },
  [GasHistoryPercentile.VeryHigh]: {
    baseFeePercentageMultiplier: 1000n,
    priorityFeePercentageMultiplier: BigInt(200),
    minSuggestedMaxPriorityFeePerGas: BigInt(4000000000), // 4_000_000_000
  },
};

const getMedianBigNumber = (feeHistoryOutputs: bigint[]): bigint => {
  const { length } = feeHistoryOutputs;
  if (length === 0) {
    throw new Error('No fee history outputs');
  }
  const sorted = feeHistoryOutputs.sort((a, b) => {
    return a - b < 0 ? -1 : 1;
  });
  // Middle index, rounded down.
  // eg. Should return 2nd item out of 4, 3/5, 3/6 and 4/7, converted to 0-indexed indeces.
  const middleIndex = Math.ceil(length / 2 - 1);
  return sorted[middleIndex];
};

// WARNING: TRANSACTIONS RISK BEING REVERTED IF YOU MODIFY THIS.
const gasHistoryPercentileForChain = (
  chain: RelayerChain,
): GasHistoryPercentile => {
  switch (chain.type) {
    case ChainType.EVM: {
      switch (chain.id) {
        case NetworkChainID.Ethereum:
          return GasHistoryPercentile.Low;
        case NetworkChainID.Hardhat:
        case NetworkChainID.Arbitrum:
        case NetworkChainID.ArbitrumGoerli:
          return GasHistoryPercentile.Medium;
        case NetworkChainID.EthereumGoerli:
        case NetworkChainID.BNBChain:
        case NetworkChainID.PolygonPOS:
          return GasHistoryPercentile.High;
        case NetworkChainID.PolygonMumbai:
          return GasHistoryPercentile.VeryHigh;
      }
    }
  }
};

export const getGasDetailsForSpeed = async (
  evmGasType: EVMGasType,
  chain: RelayerChain,
  percentile: GasHistoryPercentile,
): Promise<GasDetails> => {
  if (supportsBlockNativeGasEstimates(chain)) {
    const gasDetailsBySpeedBlockNative = await getGasDetailsBySpeedBlockNative(
      evmGasType,
      chain,
    );
    if (gasDetailsBySpeedBlockNative) {
      return gasDetailsBySpeedBlockNative[percentile];
    }
  }

  switch (evmGasType) {
    case EVMGasType.Type0:
    case EVMGasType.Type1: {
      const gasDetailsBySpeed = await estimateGasPricesBySpeedUsingHeuristic(
        evmGasType,
        chain,
      );
      return gasDetailsBySpeed[percentile];
    }
    case EVMGasType.Type2: {
      const gasDetailsBySpeed = await estimateGasMaxFeesBySpeedUsingHeuristic(
        evmGasType,
        chain,
      );
      return gasDetailsBySpeed[percentile];
    }
  }
};

export const getStandardGasDetails = (
  evmGasType: EVMGasType,
  chain: RelayerChain,
): Promise<GasDetails> => {
  const percentile = gasHistoryPercentileForChain(chain);
  return getGasDetailsForSpeed(evmGasType, chain, percentile);
};

const gasPriceForPercentile = (
  gasPrice: bigint,
  percentile: GasHistoryPercentile,
) => {
  const settings = SETTINGS_BY_PRIORITY_LEVEL[percentile];
  return (gasPrice * settings.baseFeePercentageMultiplier) / 100n;
};

export const estimateGasPricesBySpeedUsingHeuristic = async (
  evmGasType: EVMGasType.Type0 | EVMGasType.Type1,
  chain: RelayerChain,
): Promise<GasDetailsBySpeed> => {
  const provider = getProviderForNetwork(chain);
  const { gasPrice } = await provider.getFeeData();
  if (!gasPrice) {
    throw new Error(
      'Could not get current gas price (Type0 or Type1) from provider.',
    );
  }

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
    [GasHistoryPercentile.VeryHigh]: {
      evmGasType,
      gasPrice: gasPriceForPercentile(gasPrice, GasHistoryPercentile.VeryHigh),
    },
  };

  return gasPricesBySpeed;
};

/**
 * This heuristic is based on Metamask's gas price implementation.
 * We should always use BlockNative as first priority (only available for Ethereum/Polygon).
 */
const estimateGasMaxFeesBySpeedUsingHeuristic = async (
  evmGasType: EVMGasType.Type2,
  chain: RelayerChain,
): Promise<GasDetailsBySpeed> => {
  const feeHistory = await getFeeHistory(chain);

  const baseFees: bigint[] = feeHistory.baseFeePerGas.map((feeHex) =>
    BigInt(feeHex),
  );
  const priorityFeePercentile: {
    [percentile in GasHistoryPercentile]: bigint[];
  } = {
    [GasHistoryPercentile.Low]: feeHistory.reward.map((feePriorityGroup) =>
      BigInt(feePriorityGroup[0]),
    ),
    [GasHistoryPercentile.Medium]: feeHistory.reward.map((feePriorityGroup) =>
      BigInt(feePriorityGroup[1]),
    ),
    [GasHistoryPercentile.High]: feeHistory.reward.map((feePriorityGroup) =>
      BigInt(feePriorityGroup[2]),
    ),
    [GasHistoryPercentile.VeryHigh]: feeHistory.reward.map(
      (feePriorityGroup) => BigInt(feePriorityGroup[2]), // Note: same as High
    ),
  };

  const baseFeesMedian: bigint = getMedianBigNumber(baseFees);
  const priorityFeePercentileMedians: {
    [percentile in GasHistoryPercentile]: bigint;
  } = {
    [GasHistoryPercentile.Low]: getMedianBigNumber(
      priorityFeePercentile[GasHistoryPercentile.Low],
    ),
    [GasHistoryPercentile.Medium]: getMedianBigNumber(
      priorityFeePercentile[GasHistoryPercentile.Medium],
    ),
    [GasHistoryPercentile.High]: getMedianBigNumber(
      priorityFeePercentile[GasHistoryPercentile.High],
    ),
    [GasHistoryPercentile.VeryHigh]: getMedianBigNumber(
      priorityFeePercentile[GasHistoryPercentile.VeryHigh],
    ),
  };

  const suggestedGasDetails: {
    [percentile in GasHistoryPercentile]: SuggestedGasDetails;
  } = {
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
    [GasHistoryPercentile.VeryHigh]: getSuggestedGasDetails(
      baseFeesMedian,
      priorityFeePercentileMedians,
      GasHistoryPercentile.VeryHigh,
    ),
  };

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
    [GasHistoryPercentile.VeryHigh]: {
      evmGasType,
      ...suggestedGasDetails[GasHistoryPercentile.VeryHigh],
    },
  };
};

const getSuggestedGasDetails = (
  baseFeesMedian: bigint,
  priorityFeePercentileMedians: {
    [percentile in GasHistoryPercentile]: bigint;
  },
  percentile: GasHistoryPercentile,
): SuggestedGasDetails => {
  const settings = SETTINGS_BY_PRIORITY_LEVEL[percentile];
  const maxBaseFeePerGas =
    (baseFeesMedian * settings.baseFeePercentageMultiplier) / 100n;

  // Ensure no lower than min suggested priority fee.
  const priorityFee = maxBigInt(
    (priorityFeePercentileMedians[percentile] *
      settings.priorityFeePercentageMultiplier) /
      100n,
    settings.minSuggestedMaxPriorityFeePerGas,
  );

  // Ensure no higher than maxFeePerGas.
  const maxPriorityFeePerGas = minBigInt(priorityFee, maxBaseFeePerGas);

  return {
    maxPriorityFeePerGas,
    maxFeePerGas: maxBaseFeePerGas + maxPriorityFeePerGas,
  };
};
