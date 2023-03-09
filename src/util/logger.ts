/* eslint-disable @typescript-eslint/no-explicit-any */
import configDefaults from '../server/config/config-defaults';
import { DebugLevel } from '../models/debug-models';
import DebugWrapper from './debug-wrapper';

// Wrapped for testing purposes.
const dbgLog = new DebugWrapper('relayer:log');
const dbgWarn = new DebugWrapper('relayer:warn');
const dbgError = new DebugWrapper('relayer:error');

export const getDbgInstances = () => {
  return {
    dbgLog,
    dbgWarn,
    dbgError,
  };
};

const hasDebugLevel = (debugLevels: DebugLevel[]): boolean => {
  return debugLevels.includes(configDefaults.debug.logLevel);
};

const loggerImpl = {
  log: (obj: any) => {
    dbgLog.call(obj);
  },
  warn: (obj: any) => {
    dbgWarn.call(obj);
  },
  error: (error: Error) => {
    dbgError.call(error);
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
