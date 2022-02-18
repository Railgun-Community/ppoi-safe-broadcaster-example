import configDefaults from '../config/config-defaults';
import { initLepton } from '../lepton/lepton-init';
import { initWallets } from '../wallets/active-wallets';
import { initNetworkProviders } from '../providers/active-network-providers';
import { initPricePoller } from '../tokens/token-price-poller';
import { logger } from '../../util/logger';
import { initSettingsDB, closeSettingsDB } from '../db/settings-db';
import { myConfigOverrides } from '../../MY-CONFIG';

export const initRelayerModules = async () => {
  myConfigOverrides();
  initSettingsDB();
  initLepton(configDefaults.lepton.dbDir);
  await initWallets();
  initNetworkProviders();
  initPricePoller();
  logger.log('Relayer ready.');
};

export const uninitRelayerModules = () => {
  closeSettingsDB();
};
