import { Database } from '@railgun-community/wallet';
import leveldown from 'leveldown';
import { logger } from '../../util/logger';
import configDefaults from '../config/config-defaults';

const SETTINGS_DB_NAMESPACE = 'broadcaster:settings';

let db: Optional<Database>;

export const initSettingsDB = () => {
  if (db) {
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
  if (db) {
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

export const storeSettingsString = (
  key: string,
  value: string,
): Promise<void> => {
  if (!db) {
    return handleNoDBError();
  }
  return db
    .put(getPathsForKey(key), value, 'utf8')
    .catch((err) => putDbErrorHandler(key, value, err));
};

export const storeSettingsBytes = (
  key: string,
  value: string,
): Promise<void> => {
  if (!db) {
    return handleNoDBError();
  }
  return db
    .put(getPathsForKey(key), value)
    .catch((err) => putDbErrorHandler(key, value, err));
};

export const storeSettingsNumber = (
  key: string,
  value: number,
): Promise<void> => {
  if (!db) {
    return handleNoDBError();
  }
  return db
    .put(getPathsForKey(key), value, 'utf8')
    .catch((err) => putDbErrorHandler(key, value, err));
};

export const getSettingsString = (key: string): Promise<Optional<string>> => {
  if (!db) {
    return handleNoDBError();
  }
  return db
    .get(getPathsForKey(key), 'utf8')
    .catch((err) => getDbErrorHandler(key, err));
};

export const getSettingsBytes = (key: string): Promise<Optional<string>> => {
  if (!db) {
    return handleNoDBError();
  }
  return db
    .get(getPathsForKey(key))
    .catch((err) => getDbErrorHandler(key, err));
};

export const getSettingsNumber = (key: string): Promise<Optional<number>> => {
  if (!db) {
    return handleNoDBError();
  }
  return db
    .get(getPathsForKey(key), 'utf8')
    .then((val) => parseInt(val, 10))
    .catch((err) => getDbErrorHandler(key, err));
};
