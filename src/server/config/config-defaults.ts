import { DebugLevel } from '../../models/debug-models';
import { NetworkChainID } from './config-chain-ids';
import secrets from './config-secrets';

export default {
  networks: {
    /*
     * Blockchain networks to activate.
     */
    active: [
      NetworkChainID.Ethereum,
      NetworkChainID.Ropsten,
      NetworkChainID.BNBSmartChain,
      NetworkChainID.PolygonPOS,
      NetworkChainID.HardHat,
    ],
  },

  debug: {
    /**
     * Log extra information about tokens, fees and incoming transactions.
     * Options: None, VerboseLogs, WarningsErrors, OnlyErrors
     */
    logLevel: DebugLevel.VerboseLogs,

    /**
     * Whether to show verbose Lepton debugging logs.
     */
    lepton: false,
  },

  transactionFees: {
    /**
     * Precision for transaction fee ratio calculations.
     */
    precision: 10 ** 8,

    /** Used when calculating the ratio of token price to gas token price.
     * We guard against price ratios under this amount, which are too imprecise.
     */
    priceRatioMinimum: 10 ** 3,

    /** How long to enable the fee sent for a given transaction.
     * Note that clients will have to prove a transaction before sending, which can take up to 20-30 seconds.
     * We recommend an expiration of 2+ minutes.
     */
    feeExpirationInMS: 2 * 60 * 1000,

    /**
     * Checks if feeCacheID is in cache map before processing a transaction.
     * The fee cache ID ensures that this exact server sent out the fees.
     * This enables a Relayer to run multiple servers with the same Rail Address,
     * although they must have different HD wallet indices.
     */
    requireMatchingFeeCacheID: false,
  },

  tokenPrices: {
    /**
     * Number of times to retry price lookup.
     */
    priceLookupRetries: 1,

    /**
     * Configurable API Keys for Pricing APIs.
     * Pro tiers are more stable and reliable.
     */
    api: {
      coingeckoProApiKey: 'CG-zmXR1JBHNGdG98yZz7QUHUTr',
    },
  },

  balances: {
    /*
     * How long to cache Gas Token balances.
     */
    gasTokenBalanceCacheTTLInMS: 5 * 60 * 1000,
  },

  settings: {
    /**
     * Directory and file where Settings leveldown db will be stored.
     */
    dbDir: process.env.SETTINGS_DB ?? 'settings.db',
  },

  lepton: {
    /**
     * Key used to encrypt wallets in the Lepton database.
     */
    dbEncryptionKey: secrets.dbEncryptionKey,

    /**
     * Directory and file where Lepton leveldown db will be stored.
     * */
    dbDir: process.env.LEPTON_DB ?? 'server.db',
  },

  wallet: {
    mnemonic: secrets.mnemonic,

    /**
     * Indeces to configure HD wallets from the same mnemonic.
     * Each separate Relayer instance must have its own HD wallets.
     * If you run multiple Relayers with the same mnemonic, set `transactionFees.requireMatchingFeeCacheID = true`
     */
    hdWallets: [
      {
        index: 0,
        priority: 1,
      },
    ],
  },

  waku: {
    /**
     * URL of nim-waku rpc server (eg http://localhost:8546).
     */
    rpcURL: process.env.WAKU_RPC_URL ?? 'http://localhost:8546',

    /**
     * Frequency to poll for new messages.
     */
    pollFrequencyInMS: 2 * 1000,

    /**
     * Frequency to broadcast fees.
     */
    broadcastFeesDelayInMS: 30 * 1000,
  },

  featureFlags: {
    /**
     * Enables arbitrary Relay Adapt cross contract calls, which
     *  are used for smart contract execution against a private balance,
     *  along with automatic wrapping during deposit/withdraw of base tokens (eg ETH).
     */
    enableRelayAdapt: true,
  },
};
