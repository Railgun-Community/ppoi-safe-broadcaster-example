import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { deserializeTransaction } from '../populated-transaction';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('populated-transaction', () => {
  it('Should throw on bad deserialization', () => {
    expect(() => deserializeTransaction('{{')).to.throw(
      'Could not deserialize transaction.',
    );
  });
}).timeout(120000);
