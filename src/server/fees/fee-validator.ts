import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { logger } from '../../util/logger';
import { getTokenFee } from './calculate-token-fee';
import { lookUpCachedUnitTokenFee } from './transaction-fee-cache';
import configNetworks from '../config/config-networks';

const comparePackagedFeeToCalculated = (
  chainID: NetworkChainID,
  packagedFee: BigNumber,
  calculatedFee: BigNumber,
) => {
  const { slippageBuffer } = configNetworks[chainID].fees;
  const calculatedFeeWithBuffer = calculatedFee
    .mul(Math.round(10000 * (1 - slippageBuffer)))
    .div(10000);
  return packagedFee.gte(calculatedFeeWithBuffer);
};

export const validateFee = (
  chainID: NetworkChainID,
  tokenAddress: string,
  maximumGas: BigNumber,
  feeCacheID: string,
  packagedFee: BigNumber,
) => {
  logger.log(`validateFee: ${tokenAddress} (chain ${chainID})`);

  // Check packaged fee against cached fee.
  // Cache expires with TTL setting: transactionFees.feeExpirationInMS.
  const cachedFee = lookUpCachedUnitTokenFee(chainID, feeCacheID, tokenAddress);
  if (cachedFee) {
    if (
      comparePackagedFeeToCalculated(
        chainID,
        packagedFee,
        cachedFee.mul(maximumGas),
      )
    ) {
      return;
    }
  }

  // Re-calculate the fee based on current pricing if cache is expired.
  let calculatedFee;
  try {
    calculatedFee = getTokenFee(chainID, maximumGas, tokenAddress);
    if (comparePackagedFeeToCalculated(chainID, packagedFee, calculatedFee)) {
      return;
    }
  } catch (err: any) {
    logger.log(`error getting current token fee: ${err.message}`);
  }

  logger.log(`cachedFee: ${cachedFee?.toString()}`);
  logger.log(`calculatedFee: ${calculatedFee?.toString()}`);
  logger.log(`tokenFee: ${packagedFee.toString()}`);

  throw new Error('Token fee too low. Please refresh and try again.');
};
