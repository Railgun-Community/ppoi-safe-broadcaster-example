import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { getERC20TokenBalance } from '../erc20-token-balance';
import {
  getMockNetwork,
  getMockToken,
  getMockWalletAddress,
} from '../../../test/mocks.test';
import { testChainEthereum } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_WALLET_ADDRESS = getMockWalletAddress();

const MOCK_CHAIN = testChainEthereum();

describe('erc20-token-balance', () => {
  before(async () => {
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockNetwork();
    await initNetworkProviders([MOCK_CHAIN]);
  });

  it('Should pull erc20 token balance of live wallet', async () => {
    const token = getMockToken(); // SHIB
    await expect(
      getERC20TokenBalance(MOCK_CHAIN, MOCK_WALLET_ADDRESS, token.address),
    ).to.not.be.rejected;
  }).timeout(30000);
}).timeout(120000);
