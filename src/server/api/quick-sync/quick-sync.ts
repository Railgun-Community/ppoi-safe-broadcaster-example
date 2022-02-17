import { QuickSync } from '@railgun-community/lepton';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import { getRailgunEventLog, QuickSyncEventLog } from './railgun-event-log';

export const quickSync: QuickSync = async (
  chainID: NetworkChainID,
  _startingBlock: number,
): Promise<QuickSyncEventLog> => {
  const { quickSyncURL } = configNetworks[chainID];
  if (!quickSyncURL) {
    // Return empty logs, Lepton will default to full scan.
    return {
      commitmentEvents: [],
      nullifierEvents: [],
    };
  }
  const log = await getRailgunEventLog(quickSyncURL);
  return log;
};
