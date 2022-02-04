import { QuickSync } from '@railgun-community/lepton';
import {
  Commitment,
  Nullifier,
} from '@railgun-community/lepton/dist/merkletree';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import { getRailgunEventLog } from './railgun-event-log';

type QuickSyncCommitmentEvent = {
  tree: number;
  startingIndex: number;
  leaves: Commitment[];
};

export type QuickSyncEventLog = {
  commitments: QuickSyncCommitmentEvent[];
  nullifiers: Nullifier[];
};

export const quickSync: QuickSync = async (
  chainID: NetworkChainID,
  _startingBlock: number,
): Promise<QuickSyncEventLog> => {
  const quickSyncURL = configNetworks[chainID].quickSyncURL;
  if (!quickSyncURL) {
    // Return empty logs, Lepton will default to full scan.
    return {
      commitments: [],
      nullifiers: [],
    };
  }
  return getRailgunEventLog(quickSyncURL);
};
