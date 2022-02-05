import { BigNumber } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import { logger } from '../../util/logger';
import { calculateTokenFeeForTransaction } from './calculate-token-fee';
import { lookUpCachedFee } from './transaction-fee-cache';

export const validateFee = async (
  chainID: NetworkChainID,
  serializedTransaction: string,
  tokenAddress: string,
  packagedFee: BigNumber,
) => {
  logger.log(`validateFee: ${tokenAddress} (chain ${chainID})`);

  // Check packaged fee against cached fee.
  // Cache expires with TTL setting: transactionFeeCacheTTLInMS.
  const cachedFee = lookUpCachedFee(serializedTransaction, tokenAddress);
  if (
    cachedFee &&
    packagedFee.gte(BigNumber.from(cachedFee.maximumGasFeeString))
  ) {
    return;
  }

  let calculatedFee;

  try {
    // Re-calculate the fee if cache is expired.
    calculatedFee = await calculateTokenFeeForTransaction(
      chainID,
      serializedTransaction,
      tokenAddress,
    );
    if (packagedFee.gte(calculatedFee)) {
      return;
    }
  } catch (err: any) {
    logger.error(err);
    throw new Error(`Unable to refresh Relayer token fee: ${err.message}`);
  }

  logger.log(`cachedFee: ${cachedFee?.maximumGasFeeString}`);
  logger.log(`calculatedFee: ${calculatedFee.toString()}`);
  logger.log(`tokenFee: ${packagedFee.toString()}`);

  throw new Error('Token fee too low. Please refresh and try again.');
};
