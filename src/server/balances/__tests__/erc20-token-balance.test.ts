import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { getERC20TokenBalance } from '../erc20-token-balance';
import {
  getMockNetwork,
  getMockToken,
  getMockWalletAddress,
} from '../../../test/mocks.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_WALLET_ADDRESS = getMockWalletAddress();

describe('erc20-token-balance', () => {
  before(() => {
    configNetworks[NetworkChainID.Ethereum] = getMockNetwork();
    initNetworkProviders();
  });

  it('Should pull erc20 token balance of live wallet', async () => {
    const token = getMockToken(); // SHIB
    await expect(
      getERC20TokenBalance(NetworkChainID.Ethereum, MOCK_WALLET_ADDRESS, token),
    ).to.not.be.rejected;
  }).timeout(30000);
}).timeout(60000);
