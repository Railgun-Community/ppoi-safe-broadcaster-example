/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import configDefaults from '../../../config/config-defaults';
import {
  cacheFeeForTransaction,
  lookUpCachedFee,
  resetTransactionFeeCache,
} from '../transaction-fee-cache';
import { delay } from '../../../util/promise-utils';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_SERIALIZED_TRANSACTION = '123';
const MOCK_TOKEN_ADDRESS = '0x00';
const MOCK_FEE = 10.0;

describe('transaction-fee-cache', () => {
  before(() => {
    // Set TTL to 50 ms.
    configDefaults.transactionFeeCacheTTLInMS = 50;
  });

  beforeEach(() => {
    resetTransactionFeeCache();
  });

  it('Should return cached fees within TTL', async () => {
    expect(
      lookUpCachedFee(MOCK_SERIALIZED_TRANSACTION, MOCK_TOKEN_ADDRESS),
    ).to.equal(undefined);

    cacheFeeForTransaction(
      MOCK_SERIALIZED_TRANSACTION,
      MOCK_TOKEN_ADDRESS,
      MOCK_FEE,
    );

    const cachedFee = lookUpCachedFee(
      MOCK_SERIALIZED_TRANSACTION,
      MOCK_TOKEN_ADDRESS,
    );
    expect(cachedFee?.feeDecimal).to.equal(MOCK_FEE);

    // Wait for cache to expire.
    await delay(51);

    expect(
      lookUpCachedFee(MOCK_SERIALIZED_TRANSACTION, MOCK_TOKEN_ADDRESS),
    ).to.equal(undefined);
  });
}).timeout(10000);
