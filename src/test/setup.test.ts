import fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';
import { NetworkChainID } from '../server/config/config-chains';
import configDefaults from '../server/config/config-defaults';
import configNetworks from '../server/config/config-networks';
import { DebugLevel } from '../models/debug-models';
import { Network } from '../models/network-models';
import { initWallets } from '../server/wallets/active-wallets';
import { getMockNetwork, MOCK_TOKEN_6_DECIMALS } from './mocks.test';
import configTokens from '../server/config/config-tokens';
import { resetMapObject } from '../util/utils';
import * as NetworkTokensModule from '../server/tokens/network-tokens';
import { RelayerChain } from '../models/chain-models';
import { ChainType } from '@railgun-community/engine/dist/models/engine-types';

export const LEPTON_TEST_DB = 'lepton.test.db';
const SETTINGS_TEST_DB = 'settings.test.db';

let savedConfigDefaults: any;

let stubERC20Decimals: SinonStub;

const setupTests = () => {
  configDefaults.debug.logLevel = DebugLevel.None;
  configDefaults.lepton.dbDir = LEPTON_TEST_DB;
  configDefaults.settings.dbDir = SETTINGS_TEST_DB;
  savedConfigDefaults = JSON.parse(JSON.stringify(configDefaults));
  resetMapObject(configTokens);
};

const stubDecimalsCall = () => {
  stubERC20Decimals = sinon
    .stub(NetworkTokensModule, 'getERC20Decimals')
    // eslint-disable-next-line require-await
    .callsFake(async (tokenAddress) => {
      if (tokenAddress === MOCK_TOKEN_6_DECIMALS) {
        return 6;
      }
      return 18;
    });
};

before(() => {
  setupTests();
  stubDecimalsCall();
});

after(() => {
  const { warn } = console;
  fs.rm(LEPTON_TEST_DB, { recursive: true }, () => {
    warn('Error removing test db.');
  });
  fs.rm(SETTINGS_TEST_DB, { recursive: true }, () => {
    warn('Error removing test db.');
  });
  stubERC20Decimals.restore();
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

export const testChainRopsten = (): RelayerChain => {
  return {
    type: ChainType.EVM,
    id: NetworkChainID.Ropsten,
  };
};
export const testChainHardhat = (): RelayerChain => {
  return {
    type: ChainType.EVM,
    id: NetworkChainID.HardHat,
  };
};

export const testChainEthereum = (): RelayerChain => {
  return {
    type: ChainType.EVM,
    id: NetworkChainID.Ethereum,
  };
};

export const setupTestNetwork = (): Network => {
  const testNetwork = getMockNetwork();
  const chain = testChainEthereum();
  configNetworks[chain.type][chain.id] = testNetwork;
  return testNetwork;
};
