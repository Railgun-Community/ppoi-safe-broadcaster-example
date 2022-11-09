import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { versionCompare } from '../versions';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('versions', () => {
  it('Should compare versions strings', () => {
    expect(versionCompare('1.0.1', '1.0')).greaterThan(0);
    expect(versionCompare('0.1', '0.0.0')).greaterThan(0);
    expect(versionCompare('1.0.1', '1.0.1')).equals(0);
    expect(versionCompare('1.9.99', '2.0.0')).lessThan(0);
    expect(versionCompare('abc', '2.0.0')).to.be.NaN;
    expect(() => versionCompare(undefined, '2')).throws();
  });
});
