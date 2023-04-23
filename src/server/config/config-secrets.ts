import { Secrets } from 'models/config-models';
import { getSecrets } from 'docker-secret';
import _prompt from 'prompt-sync';
import { sha256 } from '@ethersproject/sha2';
import { fromUTF8String, hexlify } from '@railgun-community/quickstart';

const prompt = _prompt({ sigint: true });
const getEncryptionKey = (): string => {
  const input = prompt('Enter passphrase to encrypt database: ');
  // input was already 32 bytes; don't hash
  if (hexlify(input).length === 64) {
    return input;
  }
  // hash input to 32 bytes if it's > 6 characters long
  if (input.length > 6) {
    return sha256(fromUTF8String(input));
  }
  throw new Error('Invalid passphrase');
};

const getMnemonic = (): string => {
  const input = prompt('Enter wallet mnemonic: ');
  return input;
};

const dockerSecrets = getSecrets();

/**
 * Try to load secrets
 * Check .env first (testing), then Docker secrets and finally, prompt for input
 */
const secrets: Secrets = {
  dbEncryptionKey:
    process.env.DB_ENCRYPTION_KEY ??
    dockerSecrets.DB_ENCRYPTION_KEY ??
    getEncryptionKey(),
  mnemonic: process.env.MNEMONIC ?? dockerSecrets.MNEMONIC ?? getMnemonic(),
};

export default secrets;
