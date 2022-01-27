/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { BigNumber } from 'ethers';
import { validateFee } from '../fee-validator';
import * as calculateTransactionFeeModule from '../calculate-transaction-fee';
import {
  cacheFeeForTransaction,
  resetTransactionFeeCache,
} from '../transaction-fee-cache';
import { getMockSerializedTransaction } from '../../../test/mocks.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const CHAIN_ID = 1;
const MOCK_SERIALIZED_TRANSACTION = getMockSerializedTransaction();
const MOCK_TOKEN_ADDRESS = '0x00';

let calculateTransactionFeeStub: SinonStub;

const validatePackagedFee = (packagedFee: BigNumber) => {
  return validateFee(
    CHAIN_ID,
    MOCK_SERIALIZED_TRANSACTION,
    MOCK_TOKEN_ADDRESS,
    packagedFee,
  );
};

const stubCalculateTransactionFee = (fee: BigNumber) => {
  calculateTransactionFeeStub = sinon
    .stub(calculateTransactionFeeModule, 'calculateTransactionFee')
    .resolves(fee);
};

const stubCalculateTransactionFeeError = () => {
  calculateTransactionFeeStub = sinon
    .stub(calculateTransactionFeeModule, 'calculateTransactionFee')
    .throws();
};

describe('fee-validator', () => {
  beforeEach(() => {
    resetTransactionFeeCache();
  });

  afterEach(() => {
    calculateTransactionFeeStub?.restore();
  });

  it('Should validate if packaged fee > cached fee', async () => {
    cacheFeeForTransaction(
      MOCK_SERIALIZED_TRANSACTION,
      MOCK_TOKEN_ADDRESS,
      BigNumber.from(10),
    );
    stubCalculateTransactionFeeError();
    await expect(validatePackagedFee(BigNumber.from(15))).to.be.fulfilled;
    expect(calculateTransactionFeeStub.notCalled).to.be.true;
  });

  it('Should invalidate if packaged fee < cached fee, no calculated fee', async () => {
    cacheFeeForTransaction(
      MOCK_SERIALIZED_TRANSACTION,
      MOCK_TOKEN_ADDRESS,
      BigNumber.from(10),
    );
    stubCalculateTransactionFeeError();
    await expect(validatePackagedFee(BigNumber.from(5))).to.be.rejected;
    expect(calculateTransactionFeeStub.calledOnce).to.be.true;
  });

  it('Should invalidate without a cached or calculated fee', async () => {
    stubCalculateTransactionFeeError();
    await expect(validatePackagedFee(BigNumber.from(15))).to.be.rejected;
    expect(calculateTransactionFeeStub.calledOnce).to.be.true;
  });

  it('Should validate if packaged fee > calculated fee', async () => {
    stubCalculateTransactionFee(BigNumber.from(10));
    await expect(validatePackagedFee(BigNumber.from(15))).to.be.fulfilled;
    expect(calculateTransactionFeeStub.calledOnce).to.be.true;
  });

  it('Should invalidate if packaged fee < calculated fee', async () => {
    stubCalculateTransactionFee(BigNumber.from(10));
    await expect(validatePackagedFee(BigNumber.from(5))).to.be.rejected;
    expect(calculateTransactionFeeStub.calledOnce).to.be.true;
  });
}).timeout(10000);
