import { initLepton } from '../lepton/lepton-init';
import { initWallets } from '../wallets/active-wallets';
import { initNetworkProviders } from '../providers/active-network-providers';
import { initPricePoller } from '../tokens/token-price-poller';
import { logger } from '../../util/logger';
import { initSettingsDB, closeSettingsDB } from '../db/settings-db';
import { myConfigOverrides } from '../../MY-CONFIG';
import { initTokens } from '../tokens/network-tokens';

export const initRelayerModules = async (forTest = false) => {
  if (!forTest) {
    myConfigOverrides();
  }
  initSettingsDB();
  initLepton();
  initNetworkProviders();
  await Promise.all([initWallets(), initTokens()]);
  initPricePoller();
  logger.log('Relayer ready.');
};

export const uninitRelayerModules = () => {
  closeSettingsDB();
};
