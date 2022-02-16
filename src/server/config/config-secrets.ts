import { Secrets } from 'models/config-models';
import { getSecret } from 'docker-secret';

const secrets: Secrets = {
  dbEncryptionKey:
    getSecret('DB_ENCRYPTION_KEY') ?? process.env.DB_ENCRYPTION_KEY,
  mnemonic: getSecret('MNEMONIC') ?? process.env.MNEMONIC,
};

export default secrets;
