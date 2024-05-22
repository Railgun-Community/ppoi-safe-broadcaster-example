// Adapted from https://stackoverflow.com/a/6832721

export const getBroadcasterVersion = (): string => {
  return process.env.npm_package_version ?? '0.0.0';
};
