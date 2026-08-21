import { FeeConfig } from '../../models/fee-config';
import configDefaults from './config-defaults';

const feeConfig = (
  gasEstimateLimitToActualRatio: number,
  gasEstimateVarianceBuffer: number,
  profit: number,
): FeeConfig => ({
  gasEstimateLimitToActualRatio,
  gasEstimateVarianceBuffer,
  profit,
});

// IMPORTANT: `profit` defaults to configDefaults.transactionFees.profitMargin,
// but a default parameter is resolved the moment this function is CALLED,
// not read live afterwards. Default network fee configs are built once, at
// module load time in config-networks.ts, using whatever profitMargin holds
// at that point (the built-in default). If you override profitMargin later
// in MY-CONFIG.ts, the fee config already built for a network is NOT
// retroactively updated - setting profitMargin alone silently does nothing
// to fees computed before the override ran. To actually apply a new margin,
// call setFeesForNetworkEVM(chain, feeConfigL1(ratio)) (or feeConfigL2)
// again, AFTER setting profitMargin, so it re-reads the current value.
export const feeConfigL1 = (
  gasEstimateLimitToActualRatio: number,
  gasEstimateVarianceBuffer = 0.1,
  profit = configDefaults.transactionFees.profitMargin,
): FeeConfig =>
  feeConfig(gasEstimateLimitToActualRatio, gasEstimateVarianceBuffer, profit);

/**
 * Default fee config for L2 networks.
 * Add large gas estimate variance buffer because gas estimates change commonly between Client -> Broadcaster by 20%+.
 * This gas estimation difference is only relevant on L2s.
 * If gas doesn't spike to this degree, this buffer becomes profit.
 */

export const feeConfigL2 = (
  gasEstimateLimitToActualRatio: number,
  gasEstimateVarianceBuffer = 0.3,
  profit = configDefaults.transactionFees.profitMargin,
): FeeConfig =>
  feeConfig(gasEstimateLimitToActualRatio, gasEstimateVarianceBuffer, profit);
