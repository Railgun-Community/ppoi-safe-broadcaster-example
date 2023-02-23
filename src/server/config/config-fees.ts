import { FeeConfig } from '../../models/fee-config';

export const feeConfigL1: FeeConfig = {
  slippageBuffer: 0.09,
  profit: 0.01,
};

/**
 * Default fee config for L2 networks.
 * Add large slippage buffer because gas estimates change commonly between Client -> Relayer by around 20%.
 * This gas estimation difference is only relevant on L2s.
 * If gas doesn't spike to this degree, this buffer becomes profit.
 */
export const feeConfigL2: FeeConfig = {
  slippageBuffer: 0.3,
  profit: 0.01,
};
