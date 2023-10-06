import { logger } from '../../util/logger';
import { convertCachedTokenFee, getTokenFee } from './calculate-token-fee';
import { lookUpCachedUnitTokenFee } from './transaction-fee-cache';
import configNetworks from '../config/config-networks';
import { ErrorMessage } from '../../util/errors';
import { RelayerChain } from '../../models/chain-models';
import { isDefined } from '@railgun-community/shared-models';
import { tokenForAddress } from '../tokens/network-tokens';

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

  console.log('gasEstimateVarianceBuffer', gasEstimateVarianceBuffer);
  console.log('calculatedFeeWithBuffer', calculatedFeeWithBuffer);
  console.log('packageFee', packagedFee);
  console.log('result', packagedFee >= calculatedFeeWithBuffer);

  return packagedFee >= calculatedFeeWithBuffer;
};

export const validateFee = (
  chain: RelayerChain,
  tokenAddress: string,
  maximumGas: bigint,
  feeCacheID: string,
  packagedFee: bigint,
) => {
  console.log(
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
  if (isDefined(cachedUnitTokenFee)) {
    const unitTokenFee = convertCachedTokenFee(
      cachedUnitTokenFee,
      maximumGas,
      token,
    );
    console.log('unitTokenFee', unitTokenFee);
    if (comparePackagedFeeToCalculated(chain, packagedFee, unitTokenFee)) {
      console.log('unit fee passed');
      return;
    }
  }

  // Re-calculate the fee based on current pricing if cache is expired.
  console.log('recalculating the fee');
  let calculatedFee;
  try {
    calculatedFee = getTokenFee(chain, maximumGas, tokenAddress);
    console.log('recalculatedFee', calculatedFee);
    if (comparePackagedFeeToCalculated(chain, packagedFee, calculatedFee)) {
      return;
    }
  } catch (err) {
    console.log(`error getting current token fee: ${err.message}`);
  }

  console.log(`maximumGas: ${maximumGas}`);
  console.log(`cachedUnitTokenFee: ${cachedUnitTokenFee}`);
  console.log(`calculatedFee: ${calculatedFee}`);
  console.log(`packagedFee: ${packagedFee}`);

  throw new Error(ErrorMessage.REJECTED_PACKAGED_FEE);
};
