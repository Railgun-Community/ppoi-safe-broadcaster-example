/* globals describe, before, after, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { deserializePopulatedTransaction } from '../populated-transaction';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('populated-transaction', () => {
  it('Should throw on bad deserialization', () => {
    expect(() => deserializePopulatedTransaction('{{')).to.throw(
      'Could not deserialize PopulatedTransaction.',
    );
  });
}).timeout(120000);
