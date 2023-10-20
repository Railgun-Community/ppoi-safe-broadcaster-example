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
import { ChainType } from '@railgun-community/shared-models';

export const LEPTON_TEST_DB = 'engine.test.db';
const SETTINGS_TEST_DB = 'settings.test.db';

let savedConfigDefaults: typeof configDefaults;

let stubERC20Decimals: SinonStub;

const setupTests = () => {
  configDefaults.debug.logLevel = DebugLevel.None;
  configDefaults.engine.dbDir = LEPTON_TEST_DB;
  configDefaults.settings.dbDir = SETTINGS_TEST_DB;
  savedConfigDefaults = JSON.parse(JSON.stringify(configDefaults));
  configDefaults.poi.nodeURL = 'test';
  resetMapObject(configTokens);
};

const stubDecimalsCall = () => {
  stubERC20Decimals = sinon
    .stub(NetworkTokensModule, 'getERC20Decimals')
    // eslint-disable-next-line require-await
    .callsFake(async (tokenAddress) => {
      if (tokenAddress === MOCK_TOKEN_6_DECIMALS) {
        return 6n;
      }
      return 18n;
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

export const setupSingleTestWallet = async (
  railgunWalletDerivationIndex = 0,
) => {
  configDefaults.wallet.mnemonic =
    'test test test test test test test test test test test junk';
  await initWallets(railgunWalletDerivationIndex);
};

export const resetConfigDefaults = () => {
  const keys = Object.keys(savedConfigDefaults);
  for (const key of keys) {
    // @ts-expect-error
    configDefaults[key] = savedConfigDefaults[key];
  }
};

export const testChainGoerli = (): RelayerChain => {
  return {
    type: ChainType.EVM,
    id: NetworkChainID.EthereumGoerli,
  };
};
export const testChainHardhat = (): RelayerChain => {
  return {
    type: ChainType.EVM,
    id: NetworkChainID.Hardhat,
  };
};

export const testChainEthereum = (): RelayerChain => {
  return {
    type: ChainType.EVM,
    id: NetworkChainID.Ethereum,
  };
};

export const testChainPolygon = (): RelayerChain => {
  return {
    type: ChainType.EVM,
    id: NetworkChainID.PolygonPOS,
  };
};

export const setupTestNetwork = (): Network => {
  const testNetwork = getMockNetwork();
  const chain = testChainEthereum();
  configNetworks[chain.type][chain.id] = testNetwork;
  return testNetwork;
};
