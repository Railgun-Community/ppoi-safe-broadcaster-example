export type FeeConfig = {
  // This buffer is a percentage of the estimated gas fee.
  // Add large buffer for L2s because gas estimates change commonly between Client -> Relayer by 20%+.
  gasEstimateVarianceBuffer: number;

  // Variance as a percentage, calculated by average gas limit / actual gas used.
  // Relayers send fees to clients based on a gas limit (gas estimate + 20%),
  // however the actual gas is typically 20-30% lower than the limit on L1s.
  // This buffer adjusts the fees so that the expected profit margin is more accurate.
  gasEstimateLimitToActualRatio: number;

  // As a percentage of the estimated gas fee.
  profit: number;
};
