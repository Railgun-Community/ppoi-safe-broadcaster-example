import { DebugLevel } from '../models/debug-models';

export default {
  // Refresh all token prices every 30 seconds.
  // Note that free Coingecko API tier only allows 50 requests per minute.
  // We send one request per network for every refresh (disregarding test nets).
  tokenPriceRefreshDelayInMS: 30 * 1000,

  // Retry Coingecko lookup one time.
  numRetriesCoingeckoPriceLookup: 1,

  // Log extra information about tokens, fees and incoming transactions.
  // Options: None, Error, Logs
  debugLevel: DebugLevel.Logs,

  // How long to cache the fee sent for a given transaction.
  transactionFeeCacheTTLInMS: 120 * 1000,

  // Precision for transaction fee ratio calculations.
  transactionFeePrecision: Math.pow(10, 8),

  // Used when calculating the ratio of token price to gas token price.
  // We guard against price ratios under this amount, which are too imprecise.
  transactionFeeRatioMinimum: Math.pow(10, 3),

  // waku options
  directPeers: [
    '/dns4/relayer.of.holdings/tcp/443/wss/p2p/16Uiu2HAm8xGMm2KAgvqbERJb38h7h9UdDVhmbGFBzRkC17qqHezv',
  ],
};