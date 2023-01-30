// Adapted from https://stackoverflow.com/a/6832721

export const getRelayerVersion = (): string => {
  return process.env.npm_package_version ?? '0.0.0';
};
