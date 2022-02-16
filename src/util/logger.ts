import debug from 'debug';
import configDefaults from '../server/config/config-defaults';
import { DebugLevel } from '../models/debug-models';

const dbgLog = debug('relayer:log');
const dbgWarn = debug('relayer:warn');
const dbgError = debug('relayer:error');

const hasDebugLevel = (debugLevels: DebugLevel[]): boolean => {
  return debugLevels.includes(configDefaults.debugLevel);
};

const loggerImpl = {
  log: (obj: any) => {
    dbgLog(obj);
  },
  warn: (obj: any) => {
    dbgWarn(obj);
  },
  error: (error: Error) => {
    dbgError(error);
  },
};

export const logger = {
  log: (obj: any) => {
    if (hasDebugLevel([DebugLevel.None])) {
      return;
    }
    if (!hasDebugLevel([DebugLevel.VerboseLogs])) {
      return;
    }
    loggerImpl.log(obj);
  },
  warn: (obj: any) => {
    if (hasDebugLevel([DebugLevel.None])) {
      return;
    }
    if (!hasDebugLevel([DebugLevel.VerboseLogs, DebugLevel.WarningsErrors])) {
      return;
    }
    loggerImpl.warn(obj);
  },
  error: (error: Error) => {
    if (hasDebugLevel([DebugLevel.None])) {
      return;
    }
    loggerImpl.error(error);
  },
};
