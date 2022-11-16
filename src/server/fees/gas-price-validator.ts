import { logger } from '../../util/logger';
import { ErrorMessage } from '../../util/errors';
import { RelayerChain } from '../../models/chain-models';
import { GasHistoryPercentile, getGasPricesBySpeed } from './gas-by-speed';
import { EVMGasType } from '@railgun-community/shared-models';
import { BigNumber } from '@ethersproject/bignumber';

// Lower bound is 40% of standard gas price.
const MIN_GAS_PRICE_VALIDATION_THRESHOLD_BASIS_POINTS = 4000;

const isValidMinGasPrice = (
  standardGasPrice: BigNumber,
  packagedGasPrice: BigNumber,
) => {
  // Ensure that packaged gas price is no less than 40% of standard gas price.
  const basisPointsStandardGasPrice = BigNumber.from(10000)
    .mul(packagedGasPrice)
    .div(standardGasPrice);
  return basisPointsStandardGasPrice.gte(
    MIN_GAS_PRICE_VALIDATION_THRESHOLD_BASIS_POINTS,
  );
};

export const validateMinGasPrice = async (
  chain: RelayerChain,
  minGasPrice: string,
  evmGasType: EVMGasType.Type0 | EVMGasType.Type1,
) => {
  logger.log(
    `validateMinGasPrice: minGasPrice ${minGasPrice} (chain ${chain.type}:${chain.id})`,
  );

  try {
    const gasDetailsBySpeed = await getGasPricesBySpeed(evmGasType, chain);
    const standardGasDetails = gasDetailsBySpeed[GasHistoryPercentile.Medium];
    if (standardGasDetails.evmGasType === EVMGasType.Type2) {
      throw new Error('Incorrect EVMGasType for gas price.');
    }
    const standardGasPrice = standardGasDetails.gasPrice;

    if (isValidMinGasPrice(standardGasPrice, BigNumber.from(minGasPrice))) {
      return;
    }
  } catch (err: any) {
    logger.log(`error getting current gas price: ${err.message}`);
  }

  throw new Error(ErrorMessage.GAS_PRICE_TOO_LOW);
};
