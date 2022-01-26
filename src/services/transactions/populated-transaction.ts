import { PopulatedTransaction } from 'ethers';

export const deserializePopulatedTransaction = (
  serializedTransaction: string,
): PopulatedTransaction => {
  return JSON.parse(serializedTransaction);
};
