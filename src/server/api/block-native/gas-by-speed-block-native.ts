import { EVMGasType, ChainType } from '@railgun-community/shared-models';
import axios from 'axios';
import { parseUnits } from '@ethersproject/units';
import debug from 'debug';
import configDefaults from '../../config/config-defaults';
import { RelayerChain } from '../../../models/chain-models';
import { NetworkChainID } from '../../config/config-chains';
import {
  GasDetailsBySpeed,
  GasHistoryPercentile,
} from '../../../models/gas-models';

const dbg = debug('relayer:api:block-native');

/**
 * See full param list:
 * https://docs.blocknative.com/gas-platform
 */
type BlockNativeGasAPIResponse = {
  blockPrices: BlockNativeGasAPIBlockPrice[];
};

type BlockNativeGasAPIBlockPrice = {
  estimatedPrices: BlockNativeGasAPIBlockPriceEstimatedPrice[];
};

type BlockNativeGasAPIBlockPriceEstimatedPrice = {
  confidence: number; // 99
  price: number; // gas price
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
};

enum BlockNativeConfidenceLevel {
  VeryHigh = 99,
  High = 95,
  Medium = 90,
  Low = 80,
}

export const supportsBlockNativeGasEstimates = (chain: RelayerChain) => {
  if (chain.type !== ChainType.EVM) {
    return false;
  }
  switch (chain.id) {
    case NetworkChainID.Ethereum:
    case NetworkChainID.PolygonPOS:
      return true;
    case NetworkChainID.BNBChain:
    case NetworkChainID.Arbitrum:
    case NetworkChainID.EthereumGoerli:
    case NetworkChainID.ArbitrumGoerli:
    case NetworkChainID.PolygonMumbai:
    case NetworkChainID.Hardhat:
      return false;
  }
};

const estimatedPriceForConfidenceLevel = (
  blockNativeResponse: BlockNativeGasAPIResponse,
  confidence: BlockNativeConfidenceLevel,
): BlockNativeGasAPIBlockPriceEstimatedPrice => {
  const { estimatedPrices } = blockNativeResponse.blockPrices[0];
  return (
    estimatedPrices.find(
      (estimatedPrice) => estimatedPrice.confidence === confidence,
    ) ?? estimatedPrices[0]
  );
};

/**
 * Weighted average of gas prices between min and max.
 * Use 0.0 - 1.0 for the weighting, where 1.0 is fully at the Max level.
 */
const gasPriceForConfidenceLevel = (
  blockNativeResponse: BlockNativeGasAPIResponse,
  confidenceLevelMin: BlockNativeConfidenceLevel,
  confidenceLevelMax: BlockNativeConfidenceLevel,
  averageWeighting: number,
) => {
  const gasPriceMin = estimatedPriceForConfidenceLevel(
    blockNativeResponse,
    confidenceLevelMin,
  ).price;
  const gasPriceMinUnits = parseUnits(gasPriceMin.toString(), 9)
    .mul(averageWeighting * 10000)
    .div(10000);
  const gasPriceMax = estimatedPriceForConfidenceLevel(
    blockNativeResponse,
    confidenceLevelMax,
  ).price;
  const gasPriceMaxUnits = parseUnits(gasPriceMax.toString(), 9)
    .mul(10000 - averageWeighting * 10000)
    .div(10000);
  return gasPriceMinUnits.add(gasPriceMaxUnits);
};

const maxFeesForConfidenceLevel = (
  blockNativeResponse: BlockNativeGasAPIResponse,
  confidence: BlockNativeConfidenceLevel,
) => {
  const estimatedPrice = estimatedPriceForConfidenceLevel(
    blockNativeResponse,
    confidence,
  );
  return {
    maxFeePerGas: parseUnits(estimatedPrice.maxFeePerGas.toString(), 9),
    maxPriorityFeePerGas: parseUnits(
      estimatedPrice.maxPriorityFeePerGas.toString(),
      9,
    ),
  };
};

export const getGasDetailsBySpeedBlockNative = async (
  evmGasType: EVMGasType,
  chain: RelayerChain,
  retryCount = 0,
): Promise<Optional<GasDetailsBySpeed>> => {
  try {
    if (chain.type !== ChainType.EVM) {
      throw new Error('Cannot use BlockNative Gas API for non-EVM chains.');
    }
    const url = `https://api.blocknative.com/gasprices/blockprices?chainid=${chain.id}`;
    const rsp = await axios.get(url, {
      timeout: 5000,
      headers: {
        Authorization: configDefaults.api.blockNativeApiKey,
      },
    });
    const blockNativeResponse: BlockNativeGasAPIResponse = rsp.data;

    switch (evmGasType) {
      case EVMGasType.Type0:
      case EVMGasType.Type1: {
        return {
          [GasHistoryPercentile.Low]: {
            evmGasType,
            gasPrice: gasPriceForConfidenceLevel(
              blockNativeResponse,
              BlockNativeConfidenceLevel.High,
              BlockNativeConfidenceLevel.High,
              1.0,
            ),
          },
          [GasHistoryPercentile.Medium]: {
            evmGasType,
            gasPrice: gasPriceForConfidenceLevel(
              blockNativeResponse,
              BlockNativeConfidenceLevel.High,
              BlockNativeConfidenceLevel.VeryHigh,
              0.5,
            ),
          },
          [GasHistoryPercentile.High]: {
            evmGasType,
            gasPrice: gasPriceForConfidenceLevel(
              blockNativeResponse,
              BlockNativeConfidenceLevel.High,
              BlockNativeConfidenceLevel.VeryHigh,
              0.75,
            ),
          },
          [GasHistoryPercentile.VeryHigh]: {
            evmGasType,
            gasPrice: gasPriceForConfidenceLevel(
              blockNativeResponse,
              BlockNativeConfidenceLevel.VeryHigh,
              BlockNativeConfidenceLevel.VeryHigh,
              1.0,
            ),
          },
        };
      }
      case EVMGasType.Type2: {
        return {
          [GasHistoryPercentile.Low]: {
            evmGasType,
            ...maxFeesForConfidenceLevel(
              blockNativeResponse,
              BlockNativeConfidenceLevel.Low,
            ),
          },
          [GasHistoryPercentile.Medium]: {
            evmGasType,
            ...maxFeesForConfidenceLevel(
              blockNativeResponse,
              BlockNativeConfidenceLevel.Medium,
            ),
          },
          [GasHistoryPercentile.High]: {
            evmGasType,
            ...maxFeesForConfidenceLevel(
              blockNativeResponse,
              BlockNativeConfidenceLevel.High,
            ),
          },
          [GasHistoryPercentile.VeryHigh]: {
            evmGasType,
            ...maxFeesForConfidenceLevel(
              blockNativeResponse,
              BlockNativeConfidenceLevel.VeryHigh,
            ),
          },
        };
      }
    }
  } catch (err) {
    dbg(err);
    if (retryCount > 3) {
      return undefined;
    }
    return getGasDetailsBySpeedBlockNative(evmGasType, chain, retryCount + 1);
  }
};
