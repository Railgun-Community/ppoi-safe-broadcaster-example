import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { getGasTokenBalance } from '../gas-token-balance';
import { getMockNetwork, getMockWalletAddress } from '../../../test/mocks.test';
import { testChainEthereum } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_WALLET_ADDRESS = getMockWalletAddress();

const MOCK_CHAIN = testChainEthereum();

describe('gas-token-balance', () => {
  before(async () => {
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockNetwork();
    await initNetworkProviders();
  });

  it('Should pull gas token balance of live wallet', async () => {
    await expect(getGasTokenBalance(MOCK_CHAIN, MOCK_WALLET_ADDRESS)).to.not.be
      .rejected;
  }).timeout(20000);
}).timeout(30000);
