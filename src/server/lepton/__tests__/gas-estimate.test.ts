/* globals describe, it, before, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { artifactsGetter } from '../artifacts';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('artifacts', () => {
  it('Should get artifacts from node module', async () => {
    const artifacts = await artifactsGetter();
    expect(artifacts).to.be.an('object');
  });
}).timeout(10000);
