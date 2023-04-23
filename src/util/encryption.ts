import {
  EncryptedData,
  encryptJSONDataWithSharedKey,
  tryDecryptJSONDataWithSharedKey,
} from '@railgun-community/quickstart';

export const tryDecryptData = (
  encryptedData: EncryptedData,
  sharedKey: Uint8Array,
): object | null => {
  return tryDecryptJSONDataWithSharedKey(encryptedData, sharedKey);
};

export const encryptResponseData = (
  data: object,
  sharedKey: Uint8Array,
): EncryptedData => {
  return encryptJSONDataWithSharedKey(data, sharedKey);
};
