import { Lepton } from '@railgun-community/lepton';
import leveldown from 'leveldown';
import { FallbackProvider } from '@ethersproject/providers';
import { logger } from '../../util/logger';
import { artifactsGetter } from './artifacts';
import { quickSync } from '../api/railgun-events/quick-sync';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { LeptonDebugger } from '@railgun-community/lepton/dist/models/lepton-types';
import { RelayerChain } from '../../models/chain-models';
import  { groth16 } from 'snarkjs';
import { Groth16 } from '@railgun-community/lepton/dist/prover';

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
    'relayer',
    levelDB,
    artifactsGetter,
    quickSync,
    configDefaults.debug.lepton ? leptonDebugger : undefined,
  );
  lepton.prover.setGroth16(groth16 as Groth16)
};

/**
 * Note: This call is async, but you may call it synchronously
 * so it will run the slow scan in the background.
 */
export const initLeptonNetwork = async (
  chain: RelayerChain,
  provider: FallbackProvider,
) => {
  if (!lepton) {
    // No Lepton instance (might be in unit test).
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
      `Could not load network ${chain.id} in Lepton: ${err.message}.`,
    );
  }
};
