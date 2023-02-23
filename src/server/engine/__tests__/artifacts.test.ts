import { PublicInputs } from '@railgun-community/engine';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { artifactGetter } from '../artifacts';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('artifacts', () => {
  it('Should get 2x2 artifacts from node module', async () => {
    const inputs: PublicInputs = {
      merkleRoot: BigInt(0),
      boundParamsHash: BigInt(0),
      nullifiers: [BigInt(0), BigInt(1)],
      commitmentsOut: [BigInt(0), BigInt(1)],
    };
    const artifacts = await artifactGetter(inputs);
    expect(artifacts).to.be.an('object');
  });

  it('Should error trying to get 3x2 artifacts from node module', () => {
    const inputs: PublicInputs = {
      merkleRoot: BigInt(0),
      boundParamsHash: BigInt(0),
      nullifiers: [BigInt(0), BigInt(1), BigInt(2)],
      commitmentsOut: [BigInt(0), BigInt(1)],
    };
    expect(() => artifactGetter(inputs)).to.throw(
      'No artifacts for inputs: 3x2',
    );
  });
}).timeout(10000);
