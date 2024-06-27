import { DebugLevel } from '../../models/debug-models';
import { NetworkChainID } from './config-chains';
import secrets from './config-secrets';

const firstHDWalletDefault: {
  index: number;
  priority: number;
  chains?: NetworkChainID[];
} = {
  index: 0,
  priority: 1,
  chains: undefined,
};

export default {
  /*
   * String to identify this broadcaster instance.
   * Required if running multiple Broadcaster instances with the same RAILGUN wallet / balance.
   */
  instanceIdentifier: '',

  networks: {
    /*
     * Blockchain networks to activate.
     * All active by default.
     */
    EVM: [
      NetworkChainID.Ethereum,
      NetworkChainID.EthereumGoerli,
      NetworkChainID.BNBChain,
      NetworkChainID.Arbitrum,
      NetworkChainID.PolygonPOS,
      NetworkChainID.PolygonMumbai,
      NetworkChainID.ArbitrumGoerli,
    ],
  },

  poi: {
    /** Proof of Innocence aggregator node URL */
    nodeURL: [process.env.POI_NODE_URL ?? ''], // TODO: Add a default from community-run POI aggregator.

    dbDir: process.env.POI_DB ?? 'poi.db',
  },

  debug: {
    /**
     * Log extra information about tokens, fees and incoming transactions.
     * Options: None, VerboseLogs, WarningsErrors, OnlyErrors
     */
    logLevel: DebugLevel.VerboseLogs,

    /**
     * Whether to show verbose RailgunEngine debugging logs.
     */
    engine: false,
  },

  transactionFees: {
    /**
     * Intended profit margin for relaying transactions, across all networks.
     */
    profitMargin: 0.15, // 15% profit

    /**
     * Precision for transaction fee ratio calculations.
     */
    precision: 10 ** 8,

    /**
     * Used when calculating the ratio of token price to gas token price.
     * We guard against price ratios under this amount, which are too imprecise.
     */
    priceRatioMinimum: 10 ** 3,

    /**
     * How long to enable the fee sent for a given transaction.
     * Note that clients will have to prove a transaction before sending, which can take up to 30-40 seconds per token on mobile.
     * We require an expiration of 5+ minutes.
     */
    feeExpirationInMS: 5 * 60 * 1000,

    /**
     * Checks if feeCacheID is in cache map before processing a transaction.
     * The fee cache ID ensures that this exact server sent out the fees.
     * This enables a Broadcaster to run multiple servers with the same Rail Address,
     * although they must have different HD wallet indices.
     */
    requireMatchingFeeCacheID: false,
  },

  gasEstimateSettings: {
    /**
     * Time to wait after a failed quorum gas estimate.
     */
    failedGasEstimateDelay: 300,
    failedRetryAttempts: 3,
  },

  /**
   * Enables auto-removal of pending transactions that don't mine immediately and hang for a while.
   */
  terminatePendingTransactions: false,

  /**
   * Amount of times the pending TX poller will loop, if at the end it
   * still has pending transactions; it will attempt to 'reset' the transaction
   * and clear the pending queue.
   */
  maxPendingTxRetryCount: 20,

  /**
   * Interval at which the pending transaction poller will fire off.
   * It will take (maxPendingTxRetryCount * pendingPollingTxDelay / 1000) seconds
   * to reach the point at which it will attempt to trigger the termination transaction.
   */
  pendingTxPollingDelay: 1 * 60 * 1000, // 1 minute

  tokenPrices: {
    /**
     * Number of times to retry price lookup.
     */
    priceLookupRetries: 1,
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

  engine: {
    /**
     * Key used to encrypt wallets in the RailgunEngine database.
     */
    dbEncryptionKey: secrets.dbEncryptionKey,

    /**
     * Directory and file where RailgunEngine leveldown db will be stored.
     * */
    dbDir: process.env.LEPTON_DB ?? 'server.db',
  },

  wallet: {
    mnemonic: secrets.mnemonic,

    /**
     * Cycles wallets based on balance, and usage. 'Randomly'
     * - Sorts by highest balance & disregards the last used wallet.
     * - Selects random wallet from the remaining set.
     */
    randomizeWalletSelection: false,

    /**
     * Indeces to configure HD wallets from the same mnemonic.
     * Each separate Broadcaster instance must have its own HD wallets.
     * If you run multiple Broadcasters with the same mnemonic, set `transactionFees.requireMatchingFeeCacheID = true`
     * Add optional chains to run per wallet index. Defaults to all active chains.
     */
    hdWallets: [firstHDWalletDefault],
  },

  topUps: {
    /**
     * Enables regular top-ups for each wallet when their gas tokens run low
     *  (ie. below networkConfig.gasToken.minimumBalanceForAvailability).
     * Automatically unshields ERC-20 tokens from private balance and swaps for gas token.
     */
    shouldTopUp: false,

    /**
     * How often poller attempts to top-up wallets.
     */
    refreshDelayInMS: 10 * 60 * 1000,

    /**
     * Default slippage for swap transactions.
     */
    toleratedSlippage: 0.01,

    /**
     * How often poller attempts to top-up wallets once we have found an available wallet.
     */
    foundRefreshDelayInMS: 1 * 60 * 1000,

    /**
     * List of chains that will be processed for topUps.
     */
    topUpChains: [
      NetworkChainID.Ethereum,
      NetworkChainID.BNBChain,
      NetworkChainID.PolygonPOS,
      NetworkChainID.Arbitrum,
    ],

    /**
     * List of token addresses not to swap. This list can be composed of tokens across chains.
     */
    shouldNotSwap: [] as string[],
  },

  waku: {
    /**
     * URL of nim-waku rpc server (eg http://localhost:8546).
     */
    rpcURL: process.env.WAKU_RPC_URL ?? 'http://nwaku1:8546',

    /**
     * Frequency to poll for new messages.
     */
    pollFrequencyInMS: 2 * 1000,

    /**
     * Frequency to broadcast fees.
     */
    broadcastFeesDelayInMS: 15 * 1000,

    /**
     * libp2p pubSubTopic to subscribe to.
     */
    pubSubTopic: '/waku/2/railgun-broadcaster',
  },

  api: {
    /**
     * API Key for BlockNative gas estimator.
     * Leave blank to use free tier, which is quite generous.
     */
    blockNativeApiKey: '',

    /**
     * API Key for Coingecko Price API.
     * Pro tiers are more stable and reliable.
     */
    coingeckoProApiKey: '',

    /**
     * API Key for 0x Exchange APIs.
     */
    zeroXApiKey: '',
  },
};
