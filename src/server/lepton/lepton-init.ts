import { Lepton } from '@railgun-community/lepton';
import level from 'level';
import { LeptonDebugger } from '@railgun-community/lepton/dist/models/types';
import { FallbackProvider } from '@ethersproject/providers';
import { logger } from '../../util/logger';
import { artifactsGetter } from './artifacts';
import { quickSync } from '../api/quick-sync/quick-sync';
import configDefaults from '../config/config-defaults';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';

let lepton: Lepton;

export const getLepton = () => {
  if (!lepton) {
    throw new Error('Lepton not yet init.');
  }
  return lepton;
};

export const initLepton = (dbName: string, optDebugger?: LeptonDebugger) => {
  if (lepton) {
    return;
  }
  const levelDB = level(dbName);
  const leptonDebugger: LeptonDebugger = optDebugger ?? {
    log: (msg: string) => logger.log(msg),
    error: (error: Error) => logger.error(error),
  };
  lepton = new Lepton(
    levelDB,
    artifactsGetter,
    quickSync,
    configDefaults.debugLepton ? leptonDebugger : undefined,
  );
};

export const initLeptonNetwork = (
  chainID: NetworkChainID,
  provider: FallbackProvider,
) => {
  if (!lepton) {
    // No Lepton instance (might be in unit test).
    return;
  }

  const network = configNetworks[chainID];
  const deploymentBlock = network.deploymentBlock ?? 0;

  // Note: This call is async, but we call it synchronously
  // so it runs the slow scan in the background.
  lepton.loadNetwork(chainID, network.proxyContract, provider, deploymentBlock);
};
