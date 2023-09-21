import LevelDOWN from 'leveldown';
import configDefaults from '../config/config-defaults';
import { RelayerChain } from '../../models/chain-models';
import {
  startRailgunEngine,
  stopRailgunEngine,
  ArtifactStore,
  loadProvider,
  getProver,
  Groth16,
} from '@railgun-community/wallet';
import fs from 'fs';
import {
  FallbackProviderJsonConfig,
  networkForChain,
} from '@railgun-community/shared-models';
import { DebugLevel } from '../../models/debug-models';
import { groth16 } from 'snarkjs';

let engineStarted = false;

const fileExists = (path: string): Promise<boolean> => {
  return new Promise((resolve) => {
    fs.promises
      .access(path)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
};

const testArtifactStore = new ArtifactStore(
  fs.promises.readFile,
  async (dir: any, path: any, data: any) => {
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path, data);
  },
  fileExists,
);

export const startEngine = () => {
  if (engineStarted) {
    return;
  }
  const levelDB = new LevelDOWN(configDefaults.engine.dbDir);

  const walletSource = 'relayer';
  const shouldDebug = configDefaults.debug.logLevel === DebugLevel.VerboseLogs;
  startRailgunEngine(
    walletSource,
    levelDB,
    shouldDebug,
    testArtifactStore,
    false, // useNativeArtifacts
    false, // skipMerkletreeScans
  );
  engineStarted = true;
  getProver().setSnarkJSGroth16(groth16 as Groth16);
};

export const stopEngine = async () => {
  if (!engineStarted) {
    return;
  }
  await stopRailgunEngine();
};

/**
 * Note: This call is async, but you may call it synchronously
 * so it will run the slow scan in the background.
 */
export const loadEngineProvider = async (
  chain: RelayerChain,
  providerJsonConfig: FallbackProviderJsonConfig,
) => {
  if (!engineStarted) {
    // No RailgunEngine instance (might be in unit test).
    throw new Error('No engine instance.');
  }
  const network = networkForChain(chain);
  if (!network) {
    throw new Error('Network not found.');
  }

  await loadProvider(providerJsonConfig, network.name);
};
