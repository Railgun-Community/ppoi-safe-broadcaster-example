import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import { logger } from '../../util/logger';
import { calculateTokenFeeForTransaction } from './calculate-token-fee';
import { lookUpCachedFee } from './transaction-fee-cache';

export const validateFee = async (
  chainID: NetworkChainID,
  serializedTransaction: string,
  tokenAddress: string,
  packagedFee: BigNumber,
) => {
  // Check packaged fee against cached fee.
  // Cache expires with TTL setting: transactionFeeCacheTTLInMS.
  const cachedFee = lookUpCachedFee(serializedTransaction, tokenAddress);
  if (
    cachedFee &&
    packagedFee.gte(BigNumber.from(cachedFee.maximumGasFeeString))
  ) {
    return;
  }

  try {
    // Re-calculate the fee if cache is expired.
    const calculatedFee = await calculateTokenFeeForTransaction(
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

  throw new Error(
    'Relayer token fee has expired. Please refresh and try again.',
  );
};
