import configDefaults from '../config/config-defaults';
import { DebugLevel } from '../models/debug-models';

const hasDebugLevel = (debugLevels: DebugLevel[]): boolean => {
  return debugLevels.includes(configDefaults.debugLevel);
};

/* eslint-disable no-console */
export const logger = {
  debugLog: (obj: any) => {
    if (!hasDebugLevel([DebugLevel.Logs])) {
      return;
    }
    logger.log(obj);
  },
  debugWarn: (obj: any) => {
    if (!hasDebugLevel([DebugLevel.Logs, DebugLevel.Error])) {
      return;
    }
    logger.warn(obj);
  },
  debugError: (error: Error) => {
    if (!hasDebugLevel([DebugLevel.Logs, DebugLevel.Error])) {
      return;
    }
    logger.error(error);
  },
  log: (obj: any) => {
    console.log(JSON.stringify(obj));
  },
  warn: (obj: any) => {
    console.warn(JSON.stringify(obj));
  },
  error: (error: Error) => {
    console.error(error.message);
    console.log(error.stack);
  },
};
