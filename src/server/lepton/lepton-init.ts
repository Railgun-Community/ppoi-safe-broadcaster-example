import { Lepton } from '@railgun-community/lepton';
import leveldown from 'leveldown';
import { LeptonDebugger } from '@railgun-community/lepton/dist/models/types';
import { FallbackProvider } from '@ethersproject/providers';
import { logger } from '../../util/logger';
import { artifactsGetter } from './artifacts';
import { quickSync } from '../api/railgun-events/quick-sync';
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

export const initLepton = (optDebugger?: LeptonDebugger) => {
  if (lepton) {
    return;
  }
  const levelDB = leveldown(configDefaults.lepton.dbDir);
  const leptonDebugger: LeptonDebugger = optDebugger ?? {
    log: (msg: string) => logger.log(msg),
    error: (error: Error) => {
      logger.warn('leptonDebugger error');
      logger.error(error);
    },
  };
  lepton = new Lepton(
    levelDB,
    artifactsGetter,
    quickSync,
    configDefaults.debug.lepton ? leptonDebugger : undefined,
  );
};

/**
 * Note: This call is async, but you may call it synchronously
 * so it will run the slow scan in the background.
 */
export const initLeptonNetwork = async (
  chainID: NetworkChainID,
  provider: FallbackProvider,
) => {
  if (!lepton) {
    // No Lepton instance (might be in unit test).
    return;
  }

  const network = configNetworks[chainID];
  const deploymentBlock = network.deploymentBlock ?? 0;

  try {
    await lepton.loadNetwork(
      chainID,
      network.proxyContract,
      network.relayAdaptContract,
      provider,
      deploymentBlock,
    );
  } catch (err: any) {
    logger.warn(`Could not load network ${chainID} in Lepton: ${err.message}.`);
  }
};
