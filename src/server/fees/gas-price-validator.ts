import { logger } from '../../util/logger';
import { ErrorMessage } from '../../util/errors';
import { RelayerChain } from '../../models/chain-models';
import { EVMGasType } from '@railgun-community/shared-models';
import { BigNumber } from '@ethersproject/bignumber';
import { getGasDetailsForSpeed } from './gas-by-speed';
import { GasHistoryPercentile } from '../../models/gas-models';

export const validateMinGasPrice = async (
  chain: RelayerChain,
  minGasPrice: string,
  evmGasType: EVMGasType.Type0 | EVMGasType.Type1,
) => {
  logger.log(
    `validateMinGasPrice: minGasPrice ${minGasPrice} (chain ${chain.type}:${chain.id})`,
  );

  try {
    // Low speed is 95th percentile to include in the next block.
    // Block gas submissions that are 20% below this level.
    const slowestGasDetails = await getGasDetailsForSpeed(
      evmGasType,
      chain,
      GasHistoryPercentile.Low,
    );
    if (slowestGasDetails.evmGasType === EVMGasType.Type2) {
      throw new Error('Incorrect EVMGasType for gas price.');
    }
    const slowGasPrice = slowestGasDetails.gasPrice;
    const minimumAcceptableGasPrice = slowGasPrice.mul(8000).div(10000);

    if (BigNumber.from(minGasPrice).gte(minimumAcceptableGasPrice)) {
      // Valid gas price.
      return;
    }
  } catch (err: any) {
    logger.log(`error getting current gas price: ${err.message}`);
  }

  throw new Error(ErrorMessage.GAS_PRICE_TOO_LOW);
};
