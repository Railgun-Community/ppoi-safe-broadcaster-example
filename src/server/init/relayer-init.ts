import { initLepton } from '../lepton/lepton-init';
import { initWallets } from '../wallets/active-wallets';
import { initNetworkProviders } from '../providers/active-network-providers';
import { initPricePoller } from '../tokens/token-price-poller';
import { logger } from '../../util/logger';

export const initRelayer = async () => {
  initLepton('server.db');
  await initWallets();
  initNetworkProviders();
  initPricePoller();
  logger.log('Relayer ready.');
};
