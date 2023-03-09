import { ChainType } from '@railgun-community/shared-models';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { setupTestNetwork } from '../../../test/setup.test';
import { NetworkChainID } from '../../config/config-chains';
import { configuredNetworkChains } from '../network-chain-ids';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('network-chain-ids', () => {
  before(() => {
    setupTestNetwork();
  });

  it('Should pull correct chain IDs', () => {
    const chains = configuredNetworkChains();
    expect(chains).to.deep.contain({
      type: ChainType.EVM,
      id: NetworkChainID.Ethereum,
    });
    expect(chains).not.to.contain(null);
  });
}).timeout(10000);
