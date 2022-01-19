import { DefaultsConfig } from '../models/config-models';

export default {
  // Refresh all token prices once per minute.
  tokenPriceRefreshDelayInMS: 60 * 1000,
  // Retry Coingecko lookup one time.
  numRetriesCoingeckoPriceLookup: 1,
} as DefaultsConfig;
