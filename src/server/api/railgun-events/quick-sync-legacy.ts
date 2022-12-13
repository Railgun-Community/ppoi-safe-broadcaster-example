import { AccumulatedEvents, Chain, QuickSync } from '@railgun-community/engine';
import { ChainType, networkForChain } from '@railgun-community/shared-models';
import { getRailgunEventLogLegacy } from './railgun-events-legacy';

export const quickSyncURLForEVMChain = (chain: Chain) => {
  const network = networkForChain(chain);
  if (!network || network.chain.type !== ChainType.EVM) {
    return undefined;
  }
  return `https://events.railgun.org/chain/${chain.id}`;
};

export const quickSyncLegacy: QuickSync = async (
  chain: Chain,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _startingBlock: number,
): Promise<AccumulatedEvents> => {
  const quickSyncURL = quickSyncURLForEVMChain(chain);
  if (!quickSyncURL) {
    // Return empty logs, Engine will default to full scan.
    return {
      commitmentEvents: [],
      unshieldEvents: [],
      nullifierEvents: [],
    };
  }

  // TODO: Use startingBlock in Events API and only respond with events >= block.

  const log = await getRailgunEventLogLegacy(quickSyncURL);
  return log;
};
