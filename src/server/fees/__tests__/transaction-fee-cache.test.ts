import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import configDefaults from '../../config/config-defaults';
import {
  cacheUnitFeesForTokens,
  lookUpCachedUnitTokenFee,
  resetTransactionFeeCache,
} from '../transaction-fee-cache';
import { delay } from '../../../util/promise-utils';
import { testChainEthereum } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_TOKEN_ADDRESS = '0x00';
const MOCK_FEE = 10n;

describe('transaction-fee-cache', () => {
  before(() => {
    // Set TTL to 10 ms.
    configDefaults.transactionFees.feeExpirationInMS = 10;
  });

  beforeEach(() => {
    resetTransactionFeeCache();
  });

  it('Should return cached fees within TTL', async () => {
    const MOCK_CHAIN = testChainEthereum();

    expect(
      lookUpCachedUnitTokenFee(MOCK_CHAIN, 'mockfeeid', MOCK_TOKEN_ADDRESS),
    ).to.equal(undefined);

    const feeCacheID = cacheUnitFeesForTokens(MOCK_CHAIN, {
      [MOCK_TOKEN_ADDRESS]: MOCK_FEE,
    });

    const cachedFee = lookUpCachedUnitTokenFee(
      MOCK_CHAIN,
      feeCacheID,
      MOCK_TOKEN_ADDRESS,
    );
    expect(cachedFee?.toString()).to.equal(MOCK_FEE.toString());

    // Wait for cache to expire.
    await delay(15);

    expect(
      lookUpCachedUnitTokenFee(MOCK_CHAIN, feeCacheID, MOCK_TOKEN_ADDRESS),
    ).to.equal(undefined);
  });
}).timeout(120000);
