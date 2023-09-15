import { ErrorMessage } from '../../util/errors';
import { RelayerChain } from '../../models/chain-models';
import { EVMGasType, isDefined } from '@railgun-community/shared-models';

import { getGasDetailsForSpeed } from './gas-by-speed';
import { GasHistoryPercentile } from '../../models/gas-models';
import { promiseTimeout } from '../../util/promise-utils';
import debug from 'debug';

const dbg = debug('relayer:gas-price:validate');
export const validateMinGasPrice = async (
  chain: RelayerChain,
  minGasPrice: bigint,
  evmGasType: EVMGasType.Type0 | EVMGasType.Type1,
) => {
  dbg(
    `validateMinGasPrice: minGasPrice ${minGasPrice} (chain ${chain.type}:${chain.id})`,
  );

  try {
    // Low speed is 95th percentile to include in the next block.
    // Block gas submissions that are 50% below this level.
    const slowestGasDetails = await promiseTimeout(
      getGasDetailsForSpeed(evmGasType, chain, GasHistoryPercentile.Low),
      10 * 1000,
    ).catch(() => {
      return undefined;
    });
    if (!isDefined(slowestGasDetails)) {
      return;
    }
    if (slowestGasDetails.evmGasType === EVMGasType.Type2) {
      throw new Error('Incorrect EVMGasType for gas price.');
    }
    const slowGasPrice = slowestGasDetails.gasPrice;
    const minimumAcceptableGasPrice = (slowGasPrice * 5000n) / 10000n;

    if (minGasPrice >= minimumAcceptableGasPrice) {
      // Valid gas price.
      return;
    }
  } catch (err) {
    dbg(`error getting current gas price: ${err.message}`);
  }

  throw new Error(ErrorMessage.GAS_PRICE_TOO_LOW);
};
