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
  //   getReliabilityRatios,
  getReliabilityRatio,
  setReliability,
} from '../reliability';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = {
  type: 0,
  id: 1,
};

describe('reliability-settings', () => {
  before(async () => {
    initSettingsDB();
    await clearSettingsDB();
  });

  //   afterEach(async () => {
  //     await closeSettingsDB();
  //   });

  after(async () => {
    await closeSettingsDB();
  });

  it('Should test increment Send-Success', async () => {
    const reliabilityKey = getReliabilityKeyPath(
      MOCK_CHAIN,
      ReliabilityMetric.SEND_SUCCESS,
    );
    const initialValue = await getReliability(reliabilityKey);
    expect(initialValue).to.be.undefined;
    await incrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
    const incrementedValue = await getReliability(reliabilityKey);
    expect(incrementedValue).to.equal(1);
  });

  it('Should test decrement Send-Success', async () => {
    const reliabilityKey = getReliabilityKeyPath(
      MOCK_CHAIN,
      ReliabilityMetric.SEND_SUCCESS,
    );
    const initialValue = await getReliability(reliabilityKey);
    expect(initialValue).to.equal(1);
    await decrementReliability(MOCK_CHAIN, ReliabilityMetric.SEND_SUCCESS);
    const decrementedValue = await getReliability(reliabilityKey);
    expect(decrementedValue).to.equal(0);
  });
  it('Should test reliability ratio', async () => {
    const reliabilityKey = getReliabilityKeyPath(
      MOCK_CHAIN,
      ReliabilityMetric.SEND_SUCCESS,
    );
    const failureKey = getReliabilityKeyPath(
      MOCK_CHAIN,
      ReliabilityMetric.SEND_FAILURE,
    );
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
    expect(reliabilityRatio).to.equal(0.5);
  });
});
