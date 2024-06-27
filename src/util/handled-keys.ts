import { isDefined } from '@railgun-community/shared-models';

import {
  getSettingsStringNoError,
  storeSettingsString,
} from '../server/db/settings-db';

const KEY_DB_MAX_LENGTH = 1000;
const KEY_MEM_MAX_LENGTH = 10000;

const handledClientPubKeys: string[] = [];

const handledKeyPath = 'handledClientPubKeys|broadcaster';

const addHandledClientPubKey = (pubKey: string): void => {
  handledClientPubKeys.push(pubKey);
};

export const storeHandledClientKey = async (pubKey: string): Promise<void> => {
  addHandledClientPubKey(pubKey);
  if (handledClientPubKeys.length > KEY_MEM_MAX_LENGTH) {
    handledClientPubKeys.shift();
  }
  const handledKeys = handledClientPubKeys.slice(-KEY_DB_MAX_LENGTH);
  await storeSettingsString(handledKeyPath, JSON.stringify(handledKeys));
};

export const isHandledClientPubKey = (pubKey: string): boolean => {
  return handledClientPubKeys.includes(pubKey);
};

export const clearHandledClientPubKeys = async (): Promise<void> => {
  handledClientPubKeys.length = 0;
  await storeSettingsString(handledKeyPath, '[]');
};

export const inflateHandledKeys = async (): Promise<void> => {
  const keys = await getSettingsStringNoError(handledKeyPath);
  if (isDefined(keys)) {
    handledClientPubKeys.push(...JSON.parse(keys));
  } else {
    await clearHandledClientPubKeys();
  }
};
