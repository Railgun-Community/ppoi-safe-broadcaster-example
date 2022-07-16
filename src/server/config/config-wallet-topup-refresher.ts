export type WalletTopUpRefresher = {
  refreshDelayInMS: number;
  toleratedSlippage: number;
};

export default {
  refreshDelayInMS: 500 * 1000,
  toleratedSlippage: 0.05,
} as WalletTopUpRefresher;
