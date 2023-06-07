import { logger } from '../../util/logger';
import { getTokenFee } from './calculate-token-fee';
import { lookUpCachedUnitTokenFee } from './transaction-fee-cache';
import configNetworks from '../config/config-networks';
import { ErrorMessage } from '../../util/errors';
import { RelayerChain } from '../../models/chain-models';

const comparePackagedFeeToCalculated = (
  chain: RelayerChain,
  packagedFee: bigint,
  calculatedFee: bigint,
) => {
  const { gasEstimateVarianceBuffer } =
    configNetworks[chain.type][chain.id].fees;
  const calculatedFeeWithBuffer =
    (calculatedFee *
      BigInt(Math.round(10000 * (1 - gasEstimateVarianceBuffer)))) /
    10000n;
  return packagedFee >= calculatedFeeWithBuffer;
};

export const validateFee = (
  chain: RelayerChain,
  tokenAddress: string,
  maximumGas: bigint,
  feeCacheID: string,
  packagedFee: bigint,
) => {
  logger.log(
    `validateFee: token ${tokenAddress} (chain ${chain.type}:${chain.id})`,
  );

  // Check packaged fee against cached fee.
  // Cache expires with TTL setting: transactionFees.feeExpirationInMS.
  const cachedUnitTokenFee = lookUpCachedUnitTokenFee(
    chain,
    feeCacheID,
    tokenAddress,
  );
  if (cachedUnitTokenFee) {
    if (
      comparePackagedFeeToCalculated(
        chain,
        packagedFee,
        cachedUnitTokenFee * maximumGas,
      )
    ) {
      return;
    }
  }

  // Re-calculate the fee based on current pricing if cache is expired.
  let calculatedFee;
  try {
    calculatedFee = getTokenFee(chain, maximumGas, tokenAddress);
    if (comparePackagedFeeToCalculated(chain, packagedFee, calculatedFee)) {
      return;
    }
  } catch (err) {
    logger.log(`error getting current token fee: ${err.message}`);
  }

  logger.log(`maximumGas: ${maximumGas}`);
  logger.log(`cachedUnitTokenFee: ${cachedUnitTokenFee}`);
  logger.log(`calculatedFee: ${calculatedFee}`);
  logger.log(`packagedFee: ${packagedFee}`);

  throw new Error(ErrorMessage.REJECTED_PACKAGED_FEE);
};
