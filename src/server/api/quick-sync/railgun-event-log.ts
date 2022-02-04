import axios from 'axios';
import { ERC20Note } from '@railgun-community/lepton/dist/note/erc20';
import {
  Commitment,
  EncryptedCommitment,
  GeneratedCommitment,
  Nullifier,
} from '@railgun-community/lepton/dist/merkletree';
import { logger } from '../../../util/logger';

const NUM_RETRIES = 2;

// Note: `pubkey` instead of `publicKey` in this variant.
type ERC20NoteSerializedVariant = {
  pubkey: string;
  random: string;
  amount: string;
  token: string;
};
type QuickSyncCommitmentEvent = {
  tree: number;
  startingIndex: number;
  leaves: Commitment[];
};

type HistoricalEventAPIResponse = {
  commitmentevents: {
    txid: string;
    treeNumber: number;
    startPosition: number;
    commitments: ERC20NoteSerializedVariant[] | EncryptedCommitment[];
  }[];
  nullifierevents: Nullifier[];
};

export type QuickSyncEventLog = {
  commitments: QuickSyncCommitmentEvent[];
  nullifiers: Nullifier[];
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
  if (typeof eventLog.commitmentevents !== 'object') {
    throw new Error('Expected object `commitementevents` response.');
  }
  if (typeof eventLog.nullifierevents !== 'object') {
    throw new Error('Expected object `nullifierevents` response.');
  }

  const commitments: QuickSyncCommitmentEvent[] = eventLog.commitmentevents.map(
    (event) => {
      return {
        tree: event.treeNumber,
        startingIndex: event.startPosition,
        leaves: createLeaves(event.txid, event.commitments),
      };
    },
  );

  const response = {
    commitments,
    nullifiers: eventLog.nullifierevents,
  };
  return response;
};

const createLeaves = (
  txid: string,
  unformattedCommitments: ERC20NoteSerializedVariant[] | EncryptedCommitment[],
) => {
  if (!unformattedCommitments.length) {
    return [];
  }
  if ('ciphertext' in unformattedCommitments[0]) {
    return unformattedCommitments as EncryptedCommitment[];
  }

  return (unformattedCommitments as ERC20NoteSerializedVariant[]).map(
    (erc20NoteData) => {
      const { pubkey, random, amount, token } = erc20NoteData;
      const note = new ERC20Note(pubkey, random, amount, token);

      return {
        hash: note.hash,
        txid: txid,
        data: note.serialize(),
      } as GeneratedCommitment;
    },
  );
};

export const fetchEventLog = async (
  url: string,
  retryCount = 0,
): Promise<HistoricalEventAPIResponse> => {
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
