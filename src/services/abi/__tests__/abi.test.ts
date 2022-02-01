/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { allNetworkChainIDs } from '../../chains/network-chain-ids';
import { abiForChain } from '../abi';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('abi', () => {
  it('Should get ABI for each network', async () => {
    allNetworkChainIDs().forEach((chainID) => {
      expect(() => abiForChain(chainID)).to.not.throw;
    });
  });
}).timeout(30000);
