import { FeeConfig } from "../../models/fee-config"

export const ETHFees:  FeeConfig = {
    slippageBuffer: 0.05,
    profit: 0.05,
}
export const PolyFees:  FeeConfig = {
    slippageBuffer: 0.025,
    profit: 0.01,
}
export const BSCFees:  FeeConfig = {
    slippageBuffer: 0.10,
    profit: 0.01,
}

export default {
    slippageBuffer: 0.05,
    profit: 0.01,
} as FeeConfig;