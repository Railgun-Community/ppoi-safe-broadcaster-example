import { startEngine, stopEngine } from '../engine/engine-init';
import { initWallets } from '../wallets/active-wallets';
import { initNetworkProviders } from '../providers/active-network-providers';
import {
  initPricePoller,
  stopTokenPricePolling,
} from '../tokens/token-price-poller';
import { logger } from '../../util/logger';
import { initSettingsDB, closeSettingsDB } from '../db/settings-db';
// @ts-ignore
import { myConfigOverrides } from '../../MY-CONFIG';
import { initTokens } from '../tokens/network-tokens';
import {
  initTopUpPoller,
  stopTopUpPolling,
} from '../wallets/wallet-top-up-poller';
import { setOnBalanceUpdateCallback } from '@railgun-community/wallet';
import { onBalanceUpdateCallback } from '../balances/shielded-balance-cache';
import { isDefined } from '@railgun-community/shared-models';
import { POIAssurance } from '../transactions/poi-assurance';

export const initRelayerModules = async (forTest = false) => {
  if (!forTest) {
    isDefined(myConfigOverrides) && myConfigOverrides();
  }
  initSettingsDB();
  startEngine();
  await initNetworkProviders();
  await initWallets();
  await initTokens();
  setOnBalanceUpdateCallback(onBalanceUpdateCallback);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  initPricePoller();
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  POIAssurance.init();
  logger.log('Relayer ready.');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  initTopUpPoller();
};

export const uninitRelayerModules = async () => {
  stopTokenPricePolling();
  logger.log('stopping token price polling');
  stopTopUpPolling();
  logger.log('stopping wallet top up polling');
  await closeSettingsDB();
  logger.log('closed settings db');
  await POIAssurance.deinit();
  logger.log('closed poi assurance db');
  await stopEngine();
  logger.log('unloaded engine');
};
