import { ArtifactsGetter, PublicInputs } from '@railgun-community/engine';
// @ts-ignore
import artifacts from '@railgun-community/test-artifacts';

export const artifactsGetter: ArtifactsGetter = (inputs: PublicInputs) => {
  if (
    !artifacts[inputs.nullifiers.length] ||
    !artifacts[inputs.nullifiers.length][inputs.commitmentsOut.length]
  ) {
    throw new Error(
      `No artifacts for inputs: ${inputs.nullifiers.length}x${inputs.commitmentsOut.length}`,
    );
  }
  return artifacts[inputs.nullifiers.length][inputs.commitmentsOut.length];
};
