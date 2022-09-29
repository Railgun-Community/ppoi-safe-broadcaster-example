import { QuickSync } from '@railgun-community/engine/dist/models/event-types';
import { RelayerChain } from '../../../models/chain-models';
import configNetworks from '../../config/config-networks';
import { getRailgunEventLog, QuickSyncEventLog } from './railgun-event-log';

export const quickSync: QuickSync = async (
  chain: RelayerChain,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _startingBlock: number,
): Promise<QuickSyncEventLog> => {
  const network = configNetworks[chain.type][chain.id];
  if (network.skipQuickScan) {
    // Return empty logs, RailgunEngine will default to full scan.
    return {
      commitmentEvents: [],
      nullifierEvents: [],
    };
  }
  const quickSyncURL = `https://events.railgun.org/chain/${chain.id}`;
  const log = await getRailgunEventLog(quickSyncURL);
  return log;
};
