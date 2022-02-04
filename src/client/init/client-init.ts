import { initLepton } from '../../server/lepton/lepton-init';
import { initNetworkProviders } from '../../server/providers/active-network-providers';
import { initClientWallets } from '../wallets/client-wallets';
import { logger } from '../../util/logger';

export const initClient = async () => {
  initLepton('client.db');
  await initClientWallets();
  initNetworkProviders();
  logger.log('Client ready.');
};
