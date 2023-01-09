import { BigNumber } from 'ethers';
import { logger } from '../../util/logger';
import { getTokenFee } from './calculate-token-fee';
import { lookUpCachedUnitTokenFee } from './transaction-fee-cache';
import configNetworks from '../config/config-networks';
import { ErrorMessage } from '../../util/errors';
import { RelayerChain } from '../../models/chain-models';

const comparePackagedFeeToCalculated = (
  chain: RelayerChain,
  packagedFee: BigNumber,
  calculatedFee: BigNumber,
) => {
  const { slippageBuffer } = configNetworks[chain.type][chain.id].fees;
  const calculatedFeeWithBuffer = calculatedFee
    .mul(Math.round(10000 * (1 - slippageBuffer)))
    .div(10000);
  return packagedFee.gte(calculatedFeeWithBuffer);
};

export const validateFee = (
  chain: RelayerChain,
  tokenAddress: string,
  maximumGas: BigNumber,
  feeCacheID: string,
  packagedFee: BigNumber,
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
        cachedUnitTokenFee.mul(maximumGas),
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
  } catch (err: any) {
    logger.log(`error getting current token fee: ${err.message}`);
  }

  logger.log(`maximumGas: ${maximumGas?.toString()}`);
  logger.log(`cachedUnitTokenFee: ${cachedUnitTokenFee?.toString()}`);
  logger.log(`calculatedFee: ${calculatedFee?.toString()}`);
  logger.log(`packagedFee: ${packagedFee.toString()}`);

  throw new Error(ErrorMessage.BAD_TOKEN_FEE);
};
