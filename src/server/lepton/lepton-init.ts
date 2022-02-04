import { Lepton } from '@railgun-community/lepton';
import { logger } from '../../util/logger';
import leveldown from 'leveldown';
import { artifactsGetter } from './artifacts';
import { quickSync } from '../api/quick-sync/quick-sync';
import configDefaults from '../config/config-defaults';
import { LeptonDebugger } from '@railgun-community/lepton/dist/models/types';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';
import { getProviderForNetwork } from '../providers/active-network-providers';

let lepton: Lepton;

export const getLepton = () => {
  if (!lepton) {
    throw new Error('Lepton not yet init.');
  }
  return lepton;
};

export const initLepton = (dbName: string) => {
  if (lepton) {
    return;
  }
  const leveldownDB = new leveldown(dbName);
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

export const initLeptonNetwork = (chainID: NetworkChainID) => {
  if (!lepton) {
    // No Lepton instance (might be in unit test).
    return;
  }

  const network = configNetworks[chainID];
  const provider = getProviderForNetwork(chainID);
  const deploymentBlock = 0; // TODO: Add deployment blocks for each network.

  // Note: This call is async, but we call it synchronously
  // so it runs the slow scan in the background.
  lepton.loadNetwork(chainID, network.railContract, provider, deploymentBlock);
};
