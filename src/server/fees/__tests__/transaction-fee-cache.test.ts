/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import configDefaults from '../../config/config-defaults';
import {
  cacheFeeForTransaction,
  lookUpCachedFee,
  resetTransactionFeeCache,
} from '../transaction-fee-cache';
import { delay } from '../../../util/promise-utils';
import { getMockSerializedTransaction } from '../../../test/mocks.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_SERIALIZED_TRANSACTION = getMockSerializedTransaction();
const MOCK_TOKEN_ADDRESS = '0x00';
const MOCK_FEE = BigNumber.from(10);

describe('transaction-fee-cache', () => {
  before(() => {
    // Set TTL to 50 ms.
    configDefaults.transactionFees.cacheTTLInMS = 10;
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
    expect(cachedFee?.maximumGasFeeString).to.equal(MOCK_FEE.toString());

    // Wait for cache to expire.
    await delay(11);

    expect(
      lookUpCachedFee(MOCK_SERIALIZED_TRANSACTION, MOCK_TOKEN_ADDRESS),
    ).to.equal(undefined);
  });
}).timeout(10000);
