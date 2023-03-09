import { ArtifactGetter, PublicInputs } from '@railgun-community/engine';
import artifacts from '@railgun-community/circuit-artifacts';

type Artifact = {
  zkey: ArrayLike<number>;
  wasm: Optional<ArrayLike<number>>;
  dat: Optional<ArrayLike<number>>;
  vkey: object;
};

const testNodeArtifactGetter = async (
  inputs: PublicInputs,
): Promise<Artifact> => {
  const nullifiers = inputs.nullifiers.length;
  const commitments = inputs.commitmentsOut.length;
  assertTestNodeArtifactExists(nullifiers, commitments);

  return {
    ...artifacts.getArtifact(nullifiers, commitments),
    dat: undefined,
  };
};

const assertTestNodeArtifactExists = (
  nullifiers: number,
  commitments: number,
): void => {
  const artifactList = artifacts.listArtifacts();
  const found = artifactList.find((artifactMetadata) => {
    return (
      artifactMetadata.nullifiers === nullifiers &&
      artifactMetadata.commitments === commitments
    );
  });
  if (!found) {
    throw new Error(`No artifacts for inputs: ${nullifiers}-${commitments}`);
  }
};

export const artifactGetter: ArtifactGetter = {
  getArtifacts: testNodeArtifactGetter,
  assertArtifactExists: assertTestNodeArtifactExists,
};
