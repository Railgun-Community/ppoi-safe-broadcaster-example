import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  clearSettingsDB,
  initSettingsDB,
  closeSettingsDB,
} from '../../server/db/settings-db';

import {
  getReliability,
  incrementReliability,
  decrementReliability,
  ReliabilityMetric,
  getReliabilityKeyPath,
  getReliabilityRatio,
  setReliability,
} from '../reliability';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = {
  type: 0,
  id: 1,
};

// init keys
const reliabilityKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.SEND_SUCCESS,
);
const failureKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.SEND_FAILURE,
);
const poiSuccessKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.POI_VALIDATION_SUCCESS,
);
const poiFailureKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.POI_VALIDATION_FAILURE,
);
const gasEstimateFailureKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.GAS_ESTIMATE_FAILURE,
);
const gasEstimateSuccessKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.GAS_ESTIMATE_SUCCESS,
);
const feeValidationFailureKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.FEE_VALIDATION_FAILURE,
);
const feeValidationSuccessKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.FEE_VALIDATION_SUCCESS,
);
const decodeFailureKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.DECODE_FAILURE,
);
const decodeSuccessKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.DECODE_SUCCESS,
);
const totalSeenKey = getReliabilityKeyPath(
  MOCK_CHAIN,
  ReliabilityMetric.TOTAL_SEEN,
);

describe('reliability-settings', () => {
  before(async () => {
    initSettingsDB();
    await clearSettingsDB();
  });

  after(async () => {
    await closeSettingsDB();
  });

  it('Should test increment Send-Success', async () => {
    const initialValue = await getReliability(reliabilityKey);
    expect(initialValue).to.be.undefined;
    await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
    const incrementedValue = await getReliability(reliabilityKey);
    expect(incrementedValue).to.equal(1);
  });

  it('Should test decrement Send-Success', async () => {
    const initialValue = await getReliability(reliabilityKey);
    expect(initialValue).to.equal(1);
    await decrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
    const decrementedValue = await getReliability(reliabilityKey);
    expect(decrementedValue).to.equal(0);
  });

  it('Should test reliability ratio', async () => {
    const initialValue = await getReliability(reliabilityKey);
    expect(initialValue).to.equal(0);
    await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
    const incrementedValue = await getReliability(reliabilityKey);
    await setReliability(failureKey, 0);
    const failureValue = await getReliability(failureKey);
    expect(incrementedValue).to.equal(1);
    expect(failureValue).to.equal(0);
    await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_FAILURE);

    const reliabilityRatio = await getReliabilityRatio(MOCK_CHAIN);
    console.log('reliabilityRatio', reliabilityRatio);
    expect(reliabilityRatio).to.equal(0.5);
  });

  it('Should test reliability ratio with no failure', async () => {
    const initialValue = await getReliability(reliabilityKey);
    expect(initialValue).to.equal(1);
    await setReliability(failureKey, 0);
    const failureValue = await getReliability(failureKey);
    expect(failureValue).to.equal(0);
    const reliabilityRatio = await getReliabilityRatio(MOCK_CHAIN);
    console.log('reliabilityRatio', reliabilityRatio);
    expect(reliabilityRatio).to.equal(1);
  });

  it('Should have reliability -1 if there are no sends or failures', async () => {
    await clearSettingsDB();

    const reliabilityValue = await getReliability(reliabilityKey);
    expect(reliabilityValue).to.be.undefined;
    const reliabilityRatio = await getReliabilityRatio(MOCK_CHAIN);
    console.log('reliabilityRatio', reliabilityRatio);
    expect(reliabilityRatio).to.equal(-1);
  });
  it('Should have reliability -1 if there is 1 send and 0 failures', async () => {
    const reliabilityValue = await getReliability(reliabilityKey);
    expect(reliabilityValue).to.be.undefined;
    await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
    const incrementedValue = await getReliability(reliabilityKey);
    await setReliability(failureKey, 0);
    const failureValue = await getReliability(failureKey);
    expect(incrementedValue).to.equal(1);
    expect(failureValue).to.equal(0);
    const reliabilityRatio = await getReliabilityRatio(MOCK_CHAIN);
    console.log('reliabilityRatio', reliabilityRatio);
    expect(reliabilityRatio).to.equal(1);
  });

  it('Should have -1 reliability with > 1 failure and 0 send success', async () => {
    await clearSettingsDB();

    const reliabilityValue = await getReliability(reliabilityKey);
    expect(reliabilityValue).to.be.undefined;
    await setReliability(failureKey, 1);
    const failureValue = await getReliability(failureKey);
    expect(failureValue).to.equal(1);
    const reliabilityRatio = await getReliabilityRatio(MOCK_CHAIN);
    expect(reliabilityRatio).to.equal(-1);
    await setReliability(failureKey, 2);
    const reliabilityRatioFinal = await getReliabilityRatio(MOCK_CHAIN);
    console.log('reliabilityRatio', reliabilityRatio);
    console.log('reliabilityRatioFinal', reliabilityRatioFinal);

    expect(reliabilityRatioFinal).to.equal(-1);
  });

  describe('Simulated Reliability Scores', () => {
    it('Should have 0.5 reliability with 1 send success and 1 failure', async () => {
      await clearSettingsDB();

      const reliabilityValue = await getReliability(reliabilityKey);
      expect(reliabilityValue).to.be.undefined;
      await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
      const incrementedValue = await getReliability(reliabilityKey);
      await setReliability(failureKey, 1);
      const failureValue = await getReliability(failureKey);
      expect(incrementedValue).to.equal(1);
      expect(failureValue).to.equal(1);
      const reliabilityRatio = await getReliabilityRatio(MOCK_CHAIN);
      console.log('reliabilityRatio', reliabilityRatio);
      expect(reliabilityRatio).to.equal(0.5);
    });

    it('Should have 0.5 reliability with 2 send success and 2 failure', async () => {
      await clearSettingsDB();

      const reliabilityValue = await getReliability(reliabilityKey);
      expect(reliabilityValue).to.be.undefined;
      await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
      await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
      const incrementedValue = await getReliability(reliabilityKey);
      await setReliability(failureKey, 1);
      await setReliability(failureKey, 2);
      const failureValue = await getReliability(failureKey);
      expect(incrementedValue).to.equal(2);
      expect(failureValue).to.equal(2);
      const reliabilityRatio = await getReliabilityRatio(MOCK_CHAIN);
      console.log('reliabilityRatio', reliabilityRatio);
      expect(reliabilityRatio).to.equal(0.5);
    });

    it('Should have 0.33 reliability with 1 send success and 2 failures', async () => {
      await clearSettingsDB();
      const reliabilityKey = getReliabilityKeyPath(
        MOCK_CHAIN,
        ReliabilityMetric.SEND_SUCCESS,
      );
      const failureKey = getReliabilityKeyPath(
        MOCK_CHAIN,
        ReliabilityMetric.SEND_FAILURE,
      );
      const reliabilityValue = await getReliability(reliabilityKey);
      expect(reliabilityValue).to.be.undefined;
      await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
      const incrementedValue = await getReliability(reliabilityKey);
      await setReliability(failureKey, 1);
      await setReliability(failureKey, 2);
      const failureValue = await getReliability(failureKey);
      expect(incrementedValue).to.equal(1);
      expect(failureValue).to.equal(2);
      const reliabilityRatio = await getReliabilityRatio(MOCK_CHAIN);
      console.log('reliabilityRatio', reliabilityRatio);
      expect(reliabilityRatio.toFixed(2)).to.equal('0.33');
    });

    it('Should properly calculate weights for multiple metrics', async () => {
      await clearSettingsDB();

      // increment values
      await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
      await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
      await incrementReliability(
        MOCK_CHAIN,
        ReliabilityMetric.POI_VALIDATION_SUCCESS,
      );
      await incrementReliability(
        MOCK_CHAIN,
        ReliabilityMetric.POI_VALIDATION_SUCCESS,
      );
      await incrementReliability(
        MOCK_CHAIN,
        ReliabilityMetric.GAS_ESTIMATE_SUCCESS,
      );
      await incrementReliability(
        MOCK_CHAIN,
        ReliabilityMetric.GAS_ESTIMATE_SUCCESS,
      );
      await incrementReliability(
        MOCK_CHAIN,
        ReliabilityMetric.FEE_VALIDATION_SUCCESS,
      );
      await incrementReliability(
        MOCK_CHAIN,
        ReliabilityMetric.FEE_VALIDATION_SUCCESS,
      );
      await incrementReliability(MOCK_CHAIN, ReliabilityMetric.DECODE_SUCCESS);
      await incrementReliability(MOCK_CHAIN, ReliabilityMetric.DECODE_SUCCESS);
      // set failures
      await setReliability(failureKey, 1);
      await setReliability(poiFailureKey, 1);
      await setReliability(gasEstimateFailureKey, 1);
      await setReliability(feeValidationFailureKey, 1);
      await setReliability(decodeFailureKey, 1);
      // set total count
      await setReliability(totalSeenKey, 3);
      const ratio = await getReliabilityRatio(MOCK_CHAIN);
      console.log('reliabilityRatio', ratio);
    });
    it('Should properly calculate "perfect" reliability for multiple metrics', async () => {
      await clearSettingsDB();

      // increment values
      await setReliability(reliabilityKey, 10);
      await setReliability(poiSuccessKey, 4);
      await setReliability(gasEstimateSuccessKey, 8);
      await setReliability(feeValidationSuccessKey, 10);
      await setReliability(decodeSuccessKey, 10);

      // set failures
      await setReliability(failureKey, 0);
      await setReliability(poiFailureKey, 0);
      await setReliability(gasEstimateFailureKey, 0);
      await setReliability(feeValidationFailureKey, 0);
      await setReliability(decodeFailureKey, 10);
      // set total count
      await setReliability(totalSeenKey, 20);
      const ratio = await getReliabilityRatio(MOCK_CHAIN);
      console.log('reliabilityRatio', ratio);
    });

    it('Should properly calculate "less than perfect" reliability for multiple metrics', async () => {
      await clearSettingsDB();

      // increment values
      await setReliability(reliabilityKey, 10);
      await setReliability(poiSuccessKey, 1);
      await setReliability(gasEstimateSuccessKey, 9);
      await setReliability(feeValidationSuccessKey, 10);
      await setReliability(decodeSuccessKey, 10);

      // set failures
      await setReliability(failureKey, 2);
      await setReliability(poiFailureKey, 0);
      await setReliability(gasEstimateFailureKey, 1);
      await setReliability(feeValidationFailureKey, 1);
      await setReliability(decodeFailureKey, 10);
      // set total count
      await setReliability(totalSeenKey, 20);
      const ratio = await getReliabilityRatio(MOCK_CHAIN);
      console.log('reliabilityRatio', ratio);
    });
  });
});
