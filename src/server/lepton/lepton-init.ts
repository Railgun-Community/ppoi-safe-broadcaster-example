import leveldown from 'leveldown';
import { FallbackProvider } from '@ethersproject/providers';
import { logger } from '../../util/logger';
import { artifactsGetter } from './artifacts';
import { quickSyncLegacy } from '../api/railgun-events/quick-sync-legacy';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { RelayerChain } from '../../models/chain-models';
import { groth16 } from 'snarkjs';
import {
  RailgunEngine,
  EngineDebugger,
  Groth16,
} from '@railgun-community/engine';

let lepton: RailgunEngine;

export const getRailgunEngine = () => {
  if (!lepton) {
    throw new Error('RAILGUN RailgunEngine not yet init.');
  }
  return lepton;
};

export const initEngine = (optDebugger?: EngineDebugger) => {
  if (lepton) {
    return;
  }
  const levelDB = leveldown(configDefaults.lepton.dbDir);
  const leptonDebugger: EngineDebugger = optDebugger ?? {
    log: (msg: string) => logger.log(msg),
    error: (error: Error) => {
      logger.warn('leptonDebugger error');
      logger.error(error);
    },
  };
  lepton = new RailgunEngine(
    'relayer',
    levelDB,
    artifactsGetter,
    quickSyncLegacy,
    configDefaults.debug.lepton ? leptonDebugger : undefined,
  );
  lepton.prover.setSnarkJSGroth16(groth16 as Groth16);
};

/**
 * Note: This call is async, but you may call it synchronously
 * so it will run the slow scan in the background.
 */
export const initEngineNetwork = async (
  chain: RelayerChain,
  provider: FallbackProvider,
) => {
  if (!lepton) {
    // No RailgunEngine instance (might be in unit test).
    return;
  }

  const network = configNetworks[chain.type][chain.id];
  const deploymentBlock = network.deploymentBlock ?? 0;

  try {
    await lepton.loadNetwork(
      chain,
      network.proxyContract,
      network.relayAdaptContract,
      provider,
      deploymentBlock,
    );
  } catch (err: any) {
    logger.warn(
      `Could not load network ${chain.id} in RailgunEngine: ${err.message}.`,
    );
  }
};
