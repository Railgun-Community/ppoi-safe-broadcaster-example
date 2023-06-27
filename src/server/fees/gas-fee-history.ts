import {
  FeeHistoryResult,
  GasHistoryPercentile,
} from '../../models/gas-models';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { RelayerChain } from '../../models/chain-models';
import { JsonRpcProvider } from 'ethers';
import { isDefined } from '@railgun-community/shared-models';

const HISTORICAL_BLOCK_COUNT = 5;
const REWARD_PERCENTILES: number[] = [
  GasHistoryPercentile.Low,
  GasHistoryPercentile.Medium,
  GasHistoryPercentile.High,
  GasHistoryPercentile.VeryHigh,
];

const findHeadBlockInMessage = (message: string): Optional<number> => {
  try {
    const headBlockInMessageSplit = message.split(', head ');
    if (headBlockInMessageSplit.length === 2) {
      const headBlock = parseInt(headBlockInMessageSplit[1], 10);
      if (!Number.isNaN(headBlock)) {
        return headBlock;
      }
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
};

export const getFeeHistory = async (
  chain: RelayerChain,
  recentBlock?: number,
  retryCount = 0,
): Promise<FeeHistoryResult> => {
  const provider = getProviderForNetwork(chain);
  try {
    const firstJsonRpcProvider = provider.providerConfigs[0]
      .provider as JsonRpcProvider;

    return await firstJsonRpcProvider.send('eth_feeHistory', [
      HISTORICAL_BLOCK_COUNT,
      recentBlock ?? 'latest',
      REWARD_PERCENTILES,
    ]);
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    if (err.message && err.message.includes('request beyond head block')) {
      if (retryCount > 5) {
        throw new Error(
          'Recent on-chain fee history not available. Please refresh and try again.',
        );
      }
      const headBlock = findHeadBlockInMessage(err.message);
      if (isDefined(headBlock)) {
        return getFeeHistory(chain, headBlock, retryCount + 1);
      }

      // eslint-disable-next-line no-param-reassign
      recentBlock = recentBlock ?? (await provider.getBlockNumber()) - 1;
      return getFeeHistory(chain, recentBlock - 1, retryCount + 1);
    }
    throw err;
  }
};
