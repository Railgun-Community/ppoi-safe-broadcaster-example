/* globals describe, it, before, beforeEach, afterEach */
import { NetworkChainID } from '../config/config-chain-ids';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import configWallets from '../config/config-wallets';
import { DebugLevel } from '../models/debug-models';
import { Network } from '../models/network-models';
import { initWallets } from '../services/wallets/active-wallets';
import { getMockNetwork } from './mocks.test';

const setupTests = () => {
  configDefaults.debugLevel = DebugLevel.None;
};

before(() => {
  setupTests();
});

export const setupSingleTestWallet = () => {
  configWallets.wallets = [
    {
      mnemonic: 'test test test test test test test test test test test junk',
    },
  ];
  initWallets();
};

export const setupTestNetwork = (): Network => {
  const testNetwork = getMockNetwork();
  configNetworks[testChainID()] = testNetwork;
  return testNetwork;
};

export const testChainID = (): NetworkChainID => {
  return 1;
};
