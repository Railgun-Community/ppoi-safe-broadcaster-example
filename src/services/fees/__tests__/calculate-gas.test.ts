/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../../config/config-chain-ids';
import { createGasDetails } from '../calculate-gas';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('calculate-gas', () => {
  it('Should create gas details from token gas', async () => {
    const tokenFee = BigNumber.from(10);
    const gasDetails = await createGasDetails(
      NetworkChainID.Ethereum,
      tokenFee,
      '0x00',
    );

    // Note: this will update when gas calc is finished.
    expect(gasDetails.gasEstimate.toNumber()).to.equal(0);
    expect(gasDetails.gasPrice.toNumber()).to.equal(0);
  });
}).timeout(10000);
