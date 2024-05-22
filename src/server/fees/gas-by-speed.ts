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

import {
  ChainType,
  EVMGasType,
  isDefined,
} from '@railgun-community/shared-models';
import { BroadcasterChain } from '../../models/chain-models';
import {
  GasHistoryPercentile,
  GasDetailsBySpeed,
  GasDetails,
} from '../../models/gas-models';
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
    baseFeePercentageMultiplier: 105n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(1_500_000_000),
  },
  [GasHistoryPercentile.Medium]: {
    baseFeePercentageMultiplier: 110n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(2_500_000_000),
  },
  [GasHistoryPercentile.High]: {
    baseFeePercentageMultiplier: 115n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(3_000_000_000),
  },
  [GasHistoryPercentile.VeryHigh]: {
    baseFeePercentageMultiplier: 125n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(4_000_000_000), // 4_000_000_000
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
  chain: BroadcasterChain,
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
        case NetworkChainID.EthereumSepolia:
        case NetworkChainID.BNBChain:
        case NetworkChainID.PolygonPOS:
          return GasHistoryPercentile.High;
        case NetworkChainID.PolygonAmoy:
        case NetworkChainID.PolygonMumbai:
          return GasHistoryPercentile.VeryHigh;
      }
    }
  }
};

export const getGasDetailsForSpeed = async (
  evmGasType: EVMGasType,
  chain: BroadcasterChain,
  percentile: GasHistoryPercentile,
): Promise<GasDetails> => {
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
  chain: BroadcasterChain,
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
  chain: BroadcasterChain,
): Promise<GasDetailsBySpeed> => {
  const provider = getProviderForNetwork(chain);
  const { gasPrice } = await provider.getFeeData();
  if (!isDefined(gasPrice)) {
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
  chain: BroadcasterChain,
): Promise<GasDetailsBySpeed> => {
  const feeHistory = await getFeeHistory(chain);

  const mostRecentBaseFeePerGas = BigInt(
    feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1],
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
    [GasHistoryPercentile.VeryHigh]: feeHistory.reward.map((feePriorityGroup) =>
      BigInt(feePriorityGroup[3]),
    ),
  };

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
      mostRecentBaseFeePerGas,
      priorityFeePercentileMedians,
      GasHistoryPercentile.Low,
    ),
    [GasHistoryPercentile.Medium]: getSuggestedGasDetails(
      mostRecentBaseFeePerGas,
      priorityFeePercentileMedians,
      GasHistoryPercentile.Medium,
    ),
    [GasHistoryPercentile.High]: getSuggestedGasDetails(
      mostRecentBaseFeePerGas,
      priorityFeePercentileMedians,
      GasHistoryPercentile.High,
    ),
    [GasHistoryPercentile.VeryHigh]: getSuggestedGasDetails(
      mostRecentBaseFeePerGas,
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
  const maxBaseFeePerGas = baseFeesMedian;
  const maxPriorityFeePerGas = priorityFeePercentileMedians[percentile];

  return {
    maxPriorityFeePerGas,
    maxFeePerGas: maxBaseFeePerGas + maxPriorityFeePerGas,
  };
};
