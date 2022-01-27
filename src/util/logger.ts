import configDefaults from '../config/config-defaults';
import { DebugLevel } from '../models/debug-models';

const hasDebugLevel = (debugLevels: DebugLevel[]): boolean => {
  return debugLevels.includes(configDefaults.debugLevel);
};

/* eslint-disable no-console */
const loggerImpl = {
  log: (obj: any) => {
    console.log(JSON.stringify(obj));
  },
  warn: (obj: any) => {
    console.warn(JSON.stringify(obj));
  },
  error: (error: Error) => {
    console.error(error);
  },
};

export const logger = {
  log: (obj: any) => {
    if (!hasDebugLevel([DebugLevel.Logs])) {
      return;
    }
    if (hasDebugLevel([DebugLevel.None])) {
      return;
    }
    loggerImpl.log(obj);
  },
  warn: (obj: any) => {
    if (!hasDebugLevel([DebugLevel.Logs, DebugLevel.Error])) {
      return;
    }
    if (hasDebugLevel([DebugLevel.None])) {
      return;
    }
    loggerImpl.warn(obj);
  },
  error: (error: Error) => {
    if (!hasDebugLevel([DebugLevel.Logs, DebugLevel.Error])) {
      return;
    }
    if (hasDebugLevel([DebugLevel.None])) {
      return;
    }
    loggerImpl.error(error);
  },
};
