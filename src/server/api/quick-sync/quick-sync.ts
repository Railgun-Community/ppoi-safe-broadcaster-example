import { QuickSync } from '@railgun-community/lepton';
import { CommitmentEvent } from '@railgun-community/lepton/dist/contract/erc20';
import { Nullifier } from '@railgun-community/lepton/dist/merkletree';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import { getRailgunEventLog } from './railgun-event-log';

export type QuickSyncEventLog = {
  commitmentEvents: CommitmentEvent[];
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
