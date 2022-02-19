import { DebugLevel } from '../../models/debug-models';
import { NetworkChainID } from './config-chain-ids';
import secrets from './config-secrets';

export default {
  networks: {
    // Blockchain networks to activate.
    active: [
      NetworkChainID.Ethereum,
      NetworkChainID.Ropsten,
      NetworkChainID.HardHat,
      NetworkChainID.BinanceSmartChain,
      NetworkChainID.PolygonPOS,
    ],
  },

  debug: {
    // Log extra information about tokens, fees and incoming transactions.
    // Options: None, VerboseLogs, WarningsErrors, OnlyErrors
    logLevel: DebugLevel.VerboseLogs,

    // Whether to show verbose Lepton debugging logs.
    lepton: false,
  },

  transactionFees: {
    // Precision for transaction fee ratio calculations.
    precision: 10 ** 8,

    // Used when calculating the ratio of token price to gas token price.
    // We guard against price ratios under this amount, which are too imprecise.
    priceRatioMinimum: 10 ** 3,

    // How long to enable the fee sent for a given transaction.
    feeExpirationInMS: 5 * 60 * 1000,
  },

  tokenPrices: {
    // Number of times to retry price lookup.
    priceLookupRetries: 1,

    // Refresh all token prices every 30 seconds.
    // Note that free Coingecko API tier only allows 50 requests per minute.
    // We send one request per network for every refresh (disregarding test nets).
    priceRefreshDelayInMS: 30 * 1000,
  },

  balances: {
    // How long to cache Gas Token balances.
    gasTokenBalanceCacheTTLInMS: 5 * 60 * 1000,
  },

  settings: {
    // Directory and file in which Settings leveldown db will be stored.
    dbDir: process.env.SETTINGS_DB ?? 'settings.db',
  },

  lepton: {
    // Key used to encrypt wallets in the Lepton database.
    dbEncryptionKey: secrets.dbEncryptionKey,

    // Directory in which Lepton leveldown db will be stored.
    dbDir: process.env.LEPTON_DB ?? 'server.db',
  },

  wallet: {
    mnemonic: secrets.mnemonic,

    // Indeces to configure HD wallets from the same mnemonic.
    // Each individual wallet needs gas funds, but they reuse the same RAILGUN wallet.
    hdWallets: [
      {
        index: 0,
        priority: 1,
      },
    ],
  },

  waku: {
    // Broadcast fees every 15 seconds.
    broadcastFeesDelayInMS: 15 * 1000,

    // URL of nim-waku rpc server (eg http://localhost:8546).
    rpcURL: process.env.WAKU_RPC_URL ?? 'http://localhost:8546',
  },
};
