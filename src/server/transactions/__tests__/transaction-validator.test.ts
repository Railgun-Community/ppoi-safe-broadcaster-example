import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { createValidTransaction } from '../transaction-validator';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('transaction-validator', () => {
  it('Should throw on bad transaction validation', () => {
    expect(() =>
      createValidTransaction({ id: 1, type: 0 },'0x1234', '{{', BigInt('0x123')),
    ).to.throw('Could not create valid transaction object.');
  });
});
