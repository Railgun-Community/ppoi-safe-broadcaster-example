import { BigNumber } from 'ethers';
import { logger } from '../../util/logger';
import { getTokenFee } from './calculate-token-fee';
import { lookUpCachedUnitTokenFee } from './transaction-fee-cache';
import { ErrorMessage } from '../../util/errors';
import { RelayerChain } from '../../models/chain-models';
import { tokenForAddress } from '../tokens/network-tokens';
import { TokenConfig } from 'models/token-models';

const comparePackagedFeeToCalculated = (
  token: TokenConfig,
  packagedFee: BigNumber,
  calculatedFee: BigNumber,
) => {
  const { gasEstimateVarianceBuffer } = token.fee;
  const calculatedFeeWithBuffer = calculatedFee
    .mul(Math.round(10000 * (1 - gasEstimateVarianceBuffer)))
    .div(10000);
  // logger.log(`calculatedFeeWithBuffer: ${calculatedFeeWithBuffer?.toString()}`);
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
  const token = tokenForAddress(chain, tokenAddress);

  if (cachedUnitTokenFee) {
    if (
      comparePackagedFeeToCalculated(
        token,
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
    if (comparePackagedFeeToCalculated(token, packagedFee, calculatedFee)) {
      return;
    }
  } catch (err) {
    logger.log(`error getting current token fee: ${err.message}`);
  }

  logger.log(`maximumGas: ${maximumGas?.toString()}`);
  logger.log(`cachedUnitTokenFee: ${cachedUnitTokenFee?.toString()}`);
  logger.log(`calculatedFee: ${calculatedFee?.toString()}`);
  logger.log(`packagedFee: ${packagedFee.toString()}`);

  throw new Error(ErrorMessage.BAD_TOKEN_FEE);
};
