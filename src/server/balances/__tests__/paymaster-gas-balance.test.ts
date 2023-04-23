import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import {
  getMockHardhatNetwork,
  getMockWalletAddress,
} from '../../../test/mocks.test';
import { testChainHardhat } from '../../../test/setup.test';
import { initContracts } from '../../contracts/init-contracts';
import { getPaymasterGasBalance } from '../paymaster-gas-balance';
import { startEngine } from '../../engine/engine-init';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_WALLET_ADDRESS = getMockWalletAddress();

// TODO: Change to ethereum once paymaster is deployed.
const chain = testChainHardhat();

describe.only('paymaster-gas-balance', () => {
  before(async () => {
    configNetworks[chain.type][chain.id] = getMockHardhatNetwork();
    startEngine();
    await initNetworkProviders([chain]);
    initContracts([chain]);
  });

  it('[HH] Should pull paymaster gas balance of live wallet', async function run() {
    if (!process.env.RUN_HARDHAT_TESTS) {
      this.skip();
      return;
    }

    const balance = await getPaymasterGasBalance(chain, MOCK_WALLET_ADDRESS);
    expect(balance).to.not.equal(
      undefined,
      'Could not get Paymaster gas balance',
    );
  }).timeout(20000);
});
