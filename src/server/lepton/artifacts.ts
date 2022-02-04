// @ts-ignore
import artifacts from 'railgun-artifacts';

export const artifactsGetter = async () => {
  if (!artifacts) {
    throw new Error('Artifacts not available.');
  }
  return artifacts.small;
};
