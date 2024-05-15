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
