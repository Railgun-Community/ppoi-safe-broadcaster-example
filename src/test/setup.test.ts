/* globals describe, it, before, beforeEach, afterEach */
import configDefaults from '../config/config-defaults';
import configWallets from '../config/config-wallets';
import { DebugLevel } from '../models/debug-models';
import { initWallets } from '../services/wallets/active-wallets';

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
