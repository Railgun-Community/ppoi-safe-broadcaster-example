import { Secrets } from 'models/config-models';
import { getSecret } from 'docker-secret';
import _prompt from 'prompt-sync';
import { hash } from '@railgun-community/lepton/dist/utils';
import {
  fromUTF8String,
  hexlify,
} from '@railgun-community/lepton/dist/utils/bytes';

const prompt = _prompt({ sigint: true });

const getEncryptionKey = (): string => {
  const input = prompt('Enter passphrase to encrypt database: ');
  // input was already 32 bytes; don't hash
  if (hexlify(input).length === 64) {
    return input;
  }
  // hash input to 32 bytes if it's > 6 characters long
  if (input.length > 6) {
    return hash.sha256(fromUTF8String(input));
  }
  throw new Error('Invalid passphrase');
};

const getMnemonic = (): string => {
  const input = prompt('Enter wallet mnemonic: ');
  if (input.split(' ').length === 12) {
    return input;
  }
  throw new Error('Invalid mnemonic');
};

/**
 * Try to load secrets
 * Check .env first (testing), then Docker secrets and finally, prompt for input
 */
const secrets: Secrets = {
  dbEncryptionKey:
    process.env.DB_ENCRYPTION_KEY ??
    getSecret('DB_ENCRYPTION_KEY') ??
    getEncryptionKey(),
  mnemonic: process.env.MNEMONIC ?? getSecret('MNEMONIC') ?? getMnemonic(),
};

export default secrets;
