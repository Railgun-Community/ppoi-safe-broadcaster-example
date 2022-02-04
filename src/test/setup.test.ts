/* globals describe, it, before, beforeEach, afterEach */
import { NetworkChainID } from '../server/config/config-chain-ids';
import configDefaults from '../server/config/config-defaults';
import configNetworks from '../server/config/config-networks';
import configWallets from '../server/config/config-wallets';
import { DebugLevel } from '../models/debug-models';
import { Network } from '../models/network-models';
import { initWallets } from '../server/wallets/active-wallets';
import { getMockNetwork } from './mocks.test';

const setupTests = () => {
  configDefaults.debugLevel = DebugLevel.None;
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

export const setupTestNetwork = (): Network => {
  const testNetwork = getMockNetwork();
  configNetworks[testChainID()] = testNetwork;
  return testNetwork;
};

export const testChainID = (): NetworkChainID => {
  return 1;
};
