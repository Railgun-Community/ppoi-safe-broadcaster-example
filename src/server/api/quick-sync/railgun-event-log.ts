import { CommitmentEvent } from '@railgun-community/lepton/dist/contract/erc20';
import { Nullifier } from '@railgun-community/lepton/dist/merkletree';
import axios from 'axios';
import { logger } from '../../../util/logger';

const NUM_RETRIES = 2;

export type QuickSyncEventLog = {
  commitmentEvents: CommitmentEvent[];
  nullifierEvents: Nullifier[];
};

export const getRailgunEventLog = async (
  quickSyncURL?: string,
): Promise<QuickSyncEventLog> => {
  if (!quickSyncURL) {
    throw new Error('Could not load historical transactions: No URL.');
  }

  const eventLog = await fetchEventLog(quickSyncURL);
  if (typeof eventLog !== 'object') {
    throw new Error('Expected object `eventLog` response.');
  }
  if (typeof eventLog.commitmentEvents !== 'object') {
    throw new Error('Expected object `commitmentEvents` response.');
  }
  if (typeof eventLog.nullifierEvents !== 'object') {
    throw new Error('Expected object `nullifierEvents` response.');
  }

  return eventLog;
};

export const fetchEventLog = async (
  url: string,
  retryCount = 0,
): Promise<QuickSyncEventLog> => {
  try {
    const rsp = await axios.get(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return rsp.data;
  } catch (error: any) {
    if (retryCount < NUM_RETRIES) {
      return fetchEventLog(url, retryCount + 1);
    }
    logger.error(error);
    throw new Error(
      'Could not pull historical transactions. Please try again.',
    );
  }
};
