/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import { BigNumber } from 'ethers';
import { validateFee } from '../fee-validator';
import * as calculateTokenFeeForTransactionModule from '../calculate-token-fee';
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

let calculateTokenFeeForTransactionStub: SinonStub;

const validatePackagedFee = (packagedFee: BigNumber) => {
  return validateFee(
    CHAIN_ID,
    MOCK_SERIALIZED_TRANSACTION,
    MOCK_TOKEN_ADDRESS,
    packagedFee,
  );
};

const stubcalculateTokenFeeForTransaction = (fee: BigNumber) => {
  calculateTokenFeeForTransactionStub = sinon
    .stub(
      calculateTokenFeeForTransactionModule,
      'calculateTokenFeeForTransaction',
    )
    .resolves(fee);
};

const stubcalculateTokenFeeForTransactionError = () => {
  calculateTokenFeeForTransactionStub = sinon
    .stub(
      calculateTokenFeeForTransactionModule,
      'calculateTokenFeeForTransaction',
    )
    .throws();
};

describe('fee-validator', () => {
  beforeEach(() => {
    resetTransactionFeeCache();
  });

  afterEach(() => {
    calculateTokenFeeForTransactionStub?.restore();
  });

  it('Should validate if packaged fee > cached fee', async () => {
    cacheFeeForTransaction(
      MOCK_SERIALIZED_TRANSACTION,
      MOCK_TOKEN_ADDRESS,
      BigNumber.from(10),
    );
    stubcalculateTokenFeeForTransactionError();
    await expect(validatePackagedFee(BigNumber.from(15))).to.be.fulfilled;
    expect(calculateTokenFeeForTransactionStub.notCalled).to.be.true;
  });

  it('Should invalidate if packaged fee < cached fee, no calculated fee', async () => {
    cacheFeeForTransaction(
      MOCK_SERIALIZED_TRANSACTION,
      MOCK_TOKEN_ADDRESS,
      BigNumber.from(10),
    );
    stubcalculateTokenFeeForTransactionError();
    await expect(validatePackagedFee(BigNumber.from(5))).to.be.rejected;
    expect(calculateTokenFeeForTransactionStub.calledOnce).to.be.true;
  });

  it('Should invalidate without a cached or calculated fee', async () => {
    stubcalculateTokenFeeForTransactionError();
    await expect(validatePackagedFee(BigNumber.from(15))).to.be.rejected;
    expect(calculateTokenFeeForTransactionStub.calledOnce).to.be.true;
  });

  it('Should validate if packaged fee > calculated fee', async () => {
    stubcalculateTokenFeeForTransaction(BigNumber.from(10));
    await expect(validatePackagedFee(BigNumber.from(15))).to.be.fulfilled;
    expect(calculateTokenFeeForTransactionStub.calledOnce).to.be.true;
  });

  it('Should invalidate if packaged fee < calculated fee', async () => {
    stubcalculateTokenFeeForTransaction(BigNumber.from(10));
    await expect(validatePackagedFee(BigNumber.from(5))).to.be.rejected;
    expect(calculateTokenFeeForTransactionStub.calledOnce).to.be.true;
  });
}).timeout(10000);
