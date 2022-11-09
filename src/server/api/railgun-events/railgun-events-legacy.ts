import axios from 'axios';
import { AccumulatedEvents } from '@railgun-community/engine';
import { logger } from '../../../util/logger';

const MAX_NUM_RETRIES = 3;

export const getRailgunEventLogLegacy = async (
  quickSyncURL: string,
): Promise<AccumulatedEvents> => {
  const eventLog = await fetchEventLog<AccumulatedEvents>(quickSyncURL);
  if (eventLog == null) {
    throw new Error('Expected object `eventLog` response.');
  }
  if (typeof eventLog.commitmentEvents !== 'object') {
    throw new Error('Expected object `commitmentEvents` response.');
  }
  if (typeof eventLog.unshieldEvents !== 'object') {
    // TODO: Add when available.
    eventLog.unshieldEvents = [];
    // throw new Error('Expected object `unshieldEvents` response.');
  }
  if (typeof eventLog.nullifierEvents !== 'object') {
    throw new Error('Expected object `nullifierEvents` response.');
  }

  return eventLog;
};

const fetchEventLog = async <ReturnType>(
  url: string,
  retryCount = 1,
): Promise<ReturnType> => {
  try {
    const rsp = await axios.get(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return rsp.data;
  } catch (err) {
    if (retryCount < MAX_NUM_RETRIES) {
      return fetchEventLog(url, retryCount + 1);
    }
    logger.error(err);
    throw new Error(
      'Could not pull historical transactions. Please try again.',
    );
  }
};
