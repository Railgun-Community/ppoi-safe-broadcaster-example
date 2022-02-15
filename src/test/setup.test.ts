/* globals describe, it, before, beforeEach, afterEach, after */
import fs from 'fs';
import { NetworkChainID } from '../server/config/config-chain-ids';
import configDefaults from '../server/config/config-defaults';
import configNetworks from '../server/config/config-networks';
import configWallets from '../server/config/config-wallets';
import { DebugLevel } from '../models/debug-models';
import { Network } from '../models/network-models';
import { initWallets } from '../server/wallets/active-wallets';
import { getMockNetwork } from './mocks.test';

const TEST_DB = 'test.db';

const setupTests = () => {
  configDefaults.mnemonic = 'test test test test test test test test test test test junk';
  configDefaults.debugLevel = DebugLevel.None;
  configDefaults.leptonDb = TEST_DB;
  configDefaults.leptonDbEncryptionKey = '12345';
};

before(() => {
  setupTests();
});

export const setupSingleTestWallet = async () => {
  configWallets.wallets = [
    {
      mnemonic: 'test test test test test test test test test test test junk',
      priority: 1,
      isShieldedReceiver: true,
    },
  ];
  await initWallets();
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
  const { log } = console;
  fs.rm(TEST_DB, { recursive: true }, (err) => { log('error removing test db'); });
  log('removed test db');
});
