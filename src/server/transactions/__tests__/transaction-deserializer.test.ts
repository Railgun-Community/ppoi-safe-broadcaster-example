import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { deserializeTransaction } from '../transaction-deserializer';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('transaction-deserializer', () => {
  it('Should throw on bad deserialization', () => {
    expect(() => deserializeTransaction('{{')).to.throw(
      'Could not deserialize transaction.',
    );
  });
}).timeout(120000);
