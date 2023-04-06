import { BigNumber } from 'ethers';
import { logger } from '../../util/logger';
import { convertCachedTokenFee, getTokenFee } from './calculate-token-fee';
import { lookUpCachedUnitTokenFee } from './transaction-fee-cache';
import configNetworks from '../config/config-networks';
import { ErrorMessage } from '../../util/errors';
import { RelayerChain } from '../../models/chain-models';
import { tokenForAddress } from '../tokens/network-tokens';

const comparePackagedFeeToCalculated = (
  chain: RelayerChain,
  packagedFee: BigNumber,
  calculatedFee: BigNumber,
) => {
  const { gasEstimateVarianceBuffer } =
    configNetworks[chain.type][chain.id].fees;
  const calculatedFeeWithBuffer = calculatedFee
    .mul(Math.round(10000 * (1 - gasEstimateVarianceBuffer)))
    .div(10000);
  // logger.log(`calculatedFeeWithBuffer: ${calculatedFeeWithBuffer?.toString()}`);
  return (
    packagedFee.gte(calculatedFee) || packagedFee.gte(calculatedFeeWithBuffer)
  );
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
  logger.warn(
    `validateFee:cachedUnitTokenFee: ${cachedUnitTokenFee?.toString()}`,
  );
  logger.warn(`maximumGas: ${maximumGas?.toString()}`);

  const token = tokenForAddress(chain, tokenAddress);
  if (cachedUnitTokenFee) {
    const unitTokenFee = convertCachedTokenFee(
      cachedUnitTokenFee,
      maximumGas,
      token,
    );

    if (comparePackagedFeeToCalculated(chain, packagedFee, unitTokenFee)) {
      return;
    }
  }

  logger.warn('First calculation failed, Cached Fee invalid.');
  // Re-calculate the fee based on current pricing if cache is expired.
  const calculatedFee = getTokenFee(chain, maximumGas, tokenAddress);
  if (comparePackagedFeeToCalculated(chain, packagedFee, calculatedFee)) {
    return;
  }
  logger.log(`maximumGas: ${maximumGas?.toString()}`);
  logger.log(`cachedUnitTokenFee: ${cachedUnitTokenFee?.toString()}`);
  logger.log(`calculatedFee: ${calculatedFee?.toString()}`);
  logger.log(`packagedFee: ${packagedFee.toString()}`);

  throw new Error(ErrorMessage.BAD_TOKEN_FEE);
};
