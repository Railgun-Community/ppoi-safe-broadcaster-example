import { Database } from '@railgun-community/wallet';
import leveldown from 'leveldown';
import { logger } from '../../util/logger';
import configDefaults from '../config/config-defaults';
import { isDefined } from '@railgun-community/shared-models';

const SETTINGS_DB_NAMESPACE = 'broadcaster:settings';

let db: Optional<Database>;

export const initSettingsDB = () => {
  if (isDefined(db)) {
    return;
  }
  const level = leveldown(configDefaults.settings.dbDir);
  db = new Database(level);
};

export const closeSettingsDB = async () => {
  try {
    await db?.close();
    db = undefined;
  } catch (err) {
    logger.error(err);
  }
};

export const clearSettingsDB = async () => {
  if (isDefined(db)) {
    await db.clearNamespace([SETTINGS_DB_NAMESPACE]);
  }
};

const getPathsForKey = (key: string): string[] => {
  return [SETTINGS_DB_NAMESPACE, key];
};

const putDbErrorHandler = (key: string, value: any, err: Error) => {
  logger.warn(`Could not store value ${value} for key ${key}`);
  logger.error(err);
};

const getDbErrorHandler = (key: string, err: Error) => {
  logger.warn(`Could not get value for key ${key}`);
  logger.error(err);
  return Promise.resolve(undefined);
};

const handleNoDBError = () => {
  logger.warn('No DB Init');
  return Promise.resolve(undefined);
};

export const storeSettingsString = async (
  key: string,
  value: string,
): Promise<void> => {
  if (!isDefined(db)) {
    return handleNoDBError();
  }
  try {
    return db.put(getPathsForKey(key), value, 'utf8');
  } catch (err) {
    return putDbErrorHandler(key, value, err);
  }
};

export const storeSettingsBytes = async (
  key: string,
  value: string,
): Promise<void> => {
  if (!isDefined(db)) {
    return handleNoDBError();
  }
  try {
    return db.put(getPathsForKey(key), value);
  } catch (err) {
    return putDbErrorHandler(key, value, err);
  }
};

export const storeSettingsNumber = async (
  key: string,
  value: number,
): Promise<void> => {
  if (!isDefined(db)) {
    return handleNoDBError();
  }
  try {
    return db.put(getPathsForKey(key), value, 'utf8');
  } catch (err) {
    return putDbErrorHandler(key, value, err);
  }
};

export const getSettingsString = async (
  key: string,
): Promise<Optional<string>> => {
  if (!isDefined(db)) {
    return handleNoDBError();
  }
  return db
    .get(getPathsForKey(key), 'utf8')
    .catch((err) => getDbErrorHandler(key, err));
};

export const getSettingsBytes = async (
  key: string,
): Promise<Optional<string>> => {
  if (!isDefined(db)) {
    return handleNoDBError();
  }
  return db
    .get(getPathsForKey(key))
    .catch((err) => getDbErrorHandler(key, err));
};

export const getSettingsNumber = async (
  key: string,
): Promise<Optional<number>> => {
  if (!isDefined(db)) {
    return handleNoDBError();
  }
  return db
    .get(getPathsForKey(key), 'utf8')
    .then((val) => parseInt(val, 10))
    .catch((err) => getDbErrorHandler(key, err));
};

export const getSettingsNumberNoError = async (
  key: string,
): Promise<Optional<number>> => {
  if (!isDefined(db)) {
    return handleNoDBError();
  }
  return db
    .get(getPathsForKey(key), 'utf8')
    .then((val) => parseInt(val, 10))
    .catch(() => undefined);
};

export const getSettingsStringNoError = async (
  key: string,
): Promise<Optional<string>> => {
  if (!isDefined(db)) {
    return handleNoDBError();
  }
  return db.get(getPathsForKey(key), 'utf8').catch(() => undefined);
};
