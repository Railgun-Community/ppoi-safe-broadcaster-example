/* eslint-disable no-underscore-dangle */
export function hexToBuf(hex: string | Buffer | Uint8Array): Buffer {
  if (typeof hex === 'string') {
    return Buffer.from(hex.replace(/^0x/i, ''), 'hex');
  }
  return Buffer.from(hex);
}

export function bufToHex(buf: Uint8Array | Buffer | ArrayBuffer): string {
  const _buf = Buffer.from(buf);
  return _buf.toString('hex');
}
