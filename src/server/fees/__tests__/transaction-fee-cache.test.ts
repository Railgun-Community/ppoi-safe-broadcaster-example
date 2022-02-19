/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import configDefaults from '../../config/config-defaults';
import {
  cacheUnitFeesForTokens,
  lookUpCachedUnitTokenFee,
  resetTransactionFeeCache,
} from '../transaction-fee-cache';
import { delay } from '../../../util/promise-utils';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS = '0x00';
const MOCK_FEE = BigNumber.from(10);

describe('transaction-fee-cache', () => {
  before(() => {
    // Set TTL to 10 ms.
    configDefaults.transactionFees.feeExpirationInMS = 10;
  });

  beforeEach(() => {
    resetTransactionFeeCache();
  });

  it('Should return cached fees within TTL', async () => {
    const CHAIN_ID = 1;

    expect(
      lookUpCachedUnitTokenFee(CHAIN_ID, 'mockfeeid', MOCK_TOKEN_ADDRESS),
    ).to.equal(undefined);

    const feeCacheID = cacheUnitFeesForTokens(CHAIN_ID, {
      [MOCK_TOKEN_ADDRESS]: MOCK_FEE,
    });

    const cachedFee = lookUpCachedUnitTokenFee(
      CHAIN_ID,
      feeCacheID,
      MOCK_TOKEN_ADDRESS,
    );
    expect(cachedFee?.toString()).to.equal(MOCK_FEE.toString());

    // Wait for cache to expire.
    await delay(11);

    expect(
      lookUpCachedUnitTokenFee(CHAIN_ID, feeCacheID, MOCK_TOKEN_ADDRESS),
    ).to.equal(undefined);
  });
}).timeout(10000);
