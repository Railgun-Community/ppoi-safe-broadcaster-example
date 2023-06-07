import { ContractTransaction, getAddress, isHexString } from 'ethers';
import { logger } from '../../util/logger';

export const createValidTransaction = (
  to: string,
  data: string,
  value?: bigint,
): ContractTransaction => {
  try {
    if (!isHexString(data)) {
      throw new Error('Invalid data field.');
    }
    const validTransaction: ContractTransaction = {
      to: getAddress(to),
      data,
      value,
    };
    return validTransaction;
  } catch (err) {
    logger.error(err);
    throw new Error('Could not create valid transaction object.');
  }
};
