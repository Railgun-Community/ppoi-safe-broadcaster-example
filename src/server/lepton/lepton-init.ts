import { Lepton } from '@railgun-community/lepton';
import { logger } from '../../util/logger';
import leveldown from 'leveldown';
import { artifactsGetter } from './artifacts';
import { quickSync } from '../api/quick-sync/quick-sync';
import configDefaults from '../../config/config-defaults';
import { LeptonDebugger } from '@railgun-community/lepton/dist/models/types';

let lepton: Lepton;

export const getLepton = () => {
  if (!lepton) {
    throw new Error('Lepton not yet init.');
  }
  return lepton;
};

export const initLepton = () => {
  if (lepton) {
    return;
  }
  const leveldownDB = new leveldown('db');
  const leptonDebugger: LeptonDebugger = {
    log: (msg: string) => logger.log(msg),
    error: (error: Error) => logger.error(error),
  };
  lepton = new Lepton(
    leveldownDB,
    artifactsGetter,
    quickSync,
    configDefaults.debugLepton ? leptonDebugger : undefined,
  );
};
