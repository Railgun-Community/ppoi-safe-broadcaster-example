/* globals describe, it, before, beforeEach, afterEach, after */
import fs from 'fs';
import { NetworkChainID } from '../server/config/config-chain-ids';
import configDefaults from '../server/config/config-defaults';
import configNetworks from '../server/config/config-networks';
import { DebugLevel } from '../models/debug-models';
import { Network } from '../models/network-models';
import { initWallets } from '../server/wallets/active-wallets';
import { getMockNetwork } from './mocks.test';

const TEST_DB = 'test.db';

let savedConfigDefaults: any;

const setupTests = () => {
  configDefaults.debug.logLevel = DebugLevel.None;
  configDefaults.lepton.dbDir = TEST_DB;
  savedConfigDefaults = JSON.parse(JSON.stringify(configDefaults));
};

before(() => {
  setupTests();
});

export const setupSingleTestWallet = async () => {
  configDefaults.wallet.mnemonic =
    'test test test test test test test test test test test junk';
  await initWallets();
};

export const resetConfigDefaults = () => {
  const keys = Object.keys(savedConfigDefaults);
  for (const key of keys) {
    // @ts-ignore
    configDefaults[key] = savedConfigDefaults[key];
  }
};

export const testChainID = (): NetworkChainID => {
  return 1;
};

export const setupTestNetwork = (): Network => {
  const testNetwork = getMockNetwork();
  configNetworks[testChainID()] = testNetwork;
  return testNetwork;
};

after(() => {
  const { warn } = console;
  fs.rm(TEST_DB, { recursive: true }, (err) => {
    warn('Error removing test db.');
  });
});
