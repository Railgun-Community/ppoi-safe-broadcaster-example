import { QuickSync, QuickSyncCommitmentEvent } from '@railgun-community/lepton';
import { Nullifier } from '@railgun-community/lepton/dist/merkletree';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import { getRailgunEventLog } from './railgun-event-log';

export type QuickSyncEventLog = {
  commitmentEvents: QuickSyncCommitmentEvent[];
  nullifierEvents: Nullifier[];
};

export const quickSync: QuickSync = async (
  chainID: NetworkChainID,
  _startingBlock: number,
): Promise<QuickSyncEventLog> => {
  const quickSyncURL = configNetworks[chainID].quickSyncURL;
  if (!quickSyncURL) {
    // Return empty logs, Lepton will default to full scan.
    return {
      commitmentEvents: [],
      nullifierEvents: [],
    };
  }
  return getRailgunEventLog(quickSyncURL);
};
