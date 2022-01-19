/* eslint-disable no-underscore-dangle */
export const hexToBuf = (hex: string | Buffer | Uint8Array): Buffer => {
  if (typeof hex === 'string') {
    return Buffer.from(hex.replace(/^0x/i, ''), 'hex');
  }
  return Buffer.from(hex);
};

export const bufToHex = (buf: Uint8Array | Buffer | ArrayBuffer): string => {
  const _buf = Buffer.from(buf);
  return _buf.toString('hex');
};

export const removeNaNs = (a: number[]): number[] => {
  const newArray: number[] = [];
  a.forEach((item) => {
    if (!Number.isNaN(item)) {
      newArray.push(item);
    }
  });
  return newArray;
};
