/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { NetworkChainID } from '../../../config/config-chain-ids';
import { estimateMaximumGas } from '../gas-estimate';
import { getMockPopulatedTransaction } from '../../../test/mocks.test';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { BigNumber, Wallet } from 'ethers';

chai.use(chaiAsPromised);
const { expect } = chai;

let estimateGasStub: SinonStub;
let getGasPriceStub: SinonStub;

describe('gas-estimate', () => {
  before(() => {
    setupSingleTestWallet();
  });

  afterEach(() => {
    estimateGasStub?.restore();
    getGasPriceStub?.restore();
  });

  it('Should calculate maximum gas based on gas estimate', async () => {
    const gasEstimate = BigNumber.from(1000);
    const gasPrice = BigNumber.from(100);
    estimateGasStub = sinon
      .stub(Wallet.prototype, 'estimateGas')
      .resolves(gasEstimate);
    getGasPriceStub = sinon
      .stub(Wallet.prototype, 'getGasPrice')
      .resolves(gasPrice);

    const maximumGas = await estimateMaximumGas(
      NetworkChainID.Ethereum,
      getMockPopulatedTransaction(),
    );

    // (Gas estimate + 20%) * gas price.
    expect(maximumGas.toNumber()).to.equal(120000);
  });
}).timeout(10000);
