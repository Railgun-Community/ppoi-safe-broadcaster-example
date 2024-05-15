import { convertCachedTokenFee, getTokenFee } from './calculate-token-fee';
import { lookUpCachedUnitTokenFee } from './transaction-fee-cache';
import configNetworks from '../config/config-networks';
import { ErrorMessage } from '../../util/errors';
import { RelayerChain } from '../../models/chain-models';
import { isDefined } from '@railgun-community/shared-models';
import { tokenForAddress } from '../tokens/network-tokens';
import debug from 'debug';

const dbg = debug('broadcaster:fee:validator:');

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
  dbg(`validateFee: token ${tokenAddress} (chain ${chain.type}:${chain.id})`);

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
    if (comparePackagedFeeToCalculated(chain, packagedFee, unitTokenFee)) {
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
    dbg(`error getting current token fee: ${err.message}`);
  }
  dbg(`maximumGas: ${maximumGas}`);
  dbg(`cachedUnitTokenFee: ${cachedUnitTokenFee}`);
  dbg(`calculatedFee: ${calculatedFee}`);
  dbg(`packagedFee: ${packagedFee}`);
  throw new Error(ErrorMessage.REJECTED_PACKAGED_FEE);
};
