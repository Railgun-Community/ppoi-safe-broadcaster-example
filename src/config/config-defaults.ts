export default {
  // Refresh all token prices every 30 seconds.
  // Note that free Coingecko API tier only allows 50 requests per minute.
  // We send one request per network for every refresh (disregarding test nets).
  tokenPriceRefreshDelayInMS: 30 * 1000,

  // Retry Coingecko lookup one time.
  numRetriesCoingeckoPriceLookup: 1,
};
