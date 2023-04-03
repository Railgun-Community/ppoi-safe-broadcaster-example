import { FeeConfig } from '../../models/fee-config';
import configDefaults from './config-defaults';

export const feeConfigL1 = (
  gasEstimateLimitToActualRatio: number,
): FeeConfig => ({
  gasEstimateVarianceBuffer: 0.0,
  gasEstimateLimitToActualRatio,
  profit: configDefaults.transactionFees.profitMargin,
});

/**
 * Default fee config for L2 networks.
 * Add large gas estimate variance buffer because gas estimates change commonly between Client -> Relayer by 20%+.
 * This gas estimation difference is only relevant on L2s.
 * If gas doesn't spike to this degree, this buffer becomes profit.
 */
export const feeConfigL2 = (
  gasEstimateLimitToActualRatio: number,
): FeeConfig => ({
  gasEstimateVarianceBuffer: 0.3,
  gasEstimateLimitToActualRatio,
  profit: configDefaults.transactionFees.profitMargin,
});
