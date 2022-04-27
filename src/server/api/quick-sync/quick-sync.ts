import { QuickSync } from '@railgun-community/lepton';
import { NetworkChainID } from '../../config/config-chain-ids';
import { getRailgunEventLog, QuickSyncEventLog } from './railgun-event-log';

export const quickSync: QuickSync = async (
  chainID: NetworkChainID,
  _startingBlock: number,
): Promise<QuickSyncEventLog> => {
  if (!chainID) {
    // Return empty logs, Lepton will default to full scan.
    return {
      commitmentEvents: [],
      nullifierEvents: [],
    };
  }
  const quickSyncURL = `https://events.railgun.org/chain/${chainID}`;
  const log = await getRailgunEventLog(quickSyncURL);
  return log;
};
