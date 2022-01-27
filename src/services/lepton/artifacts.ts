enum ArtifactName {
  ZKEY = 'zkey',
  WASM = 'wasm',
  VKEY = 'vkey',
}

type ArtifactGroup = {
  [ArtifactName.ZKEY]: Buffer;
  [ArtifactName.WASM]: Buffer;
  [ArtifactName.VKEY]: object;
};

let artifacts: ArtifactGroup;

export const setSmallArtifacts = (newArtifacts: ArtifactGroup) => {
  artifacts = newArtifacts;
};

export const artifactsGetter = async () => {
  if (!artifacts) {
    throw new Error('Small artifacts not available.');
  }
  return artifacts;
};
