import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import {
  getMockEthereumNetwork,
  getMockWalletAddress,
} from '../../../test/mocks.test';
import { testChainEthereum } from '../../../test/setup.test';
import { getGasTokenBalance } from '../gas-balance';
import { startEngine } from '../../engine/engine-init';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_WALLET_ADDRESS = getMockWalletAddress();

const MOCK_CHAIN = testChainEthereum();

describe('gas-balance', () => {
  before(async () => {
    startEngine();
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockEthereumNetwork();
    await initNetworkProviders([MOCK_CHAIN]);
  });

  it('Should pull gas token balance of live wallet', async () => {
    const balance = await getGasTokenBalance(MOCK_CHAIN, MOCK_WALLET_ADDRESS);
    expect(balance).to.not.be.undefined;
  }).timeout(10000);
});
