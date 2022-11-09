// Adapted from https://stackoverflow.com/a/6832721

export const getRelayerVersion = (): string => {
  return process.env.npm_package_version ?? '0.0.0';
};

export const versionCompare = (
  appVersion?: string,
  minVersion?: string,
): number => {
  if (!appVersion || !minVersion) {
    throw new Error('Requires two version numbers to compare.');
  }

  const zeroExtend = true;
  const v1parts = appVersion.split('.');
  const v2parts = minVersion.split('.');

  function isValidPart(x: string) {
    return /^\d+$/.test(x);
  }

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
    return NaN;
  }
  if (zeroExtend) {
    while (v1parts.length < v2parts.length) {
      v1parts.push('0');
    }
    while (v2parts.length < v1parts.length) {
      v2parts.push('0');
    }
  }

  const v1parts_number = v1parts.map(Number);
  const v2parts_number = v2parts.map(Number);

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < v1parts_number.length; ++i) {
    if (v2parts_number.length === i) {
      return 1;
    }
    if (v1parts_number[i] === v2parts_number[i]) {
      continue;
    } else if (v1parts_number[i] > v2parts_number[i]) {
      return 1;
    } else {
      return -1;
    }
  }
  if (v1parts_number.length !== v2parts_number.length) {
    return -1;
  }
  return 0;
};
