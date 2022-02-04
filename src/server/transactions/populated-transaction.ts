import { PopulatedTransaction } from 'ethers';

export const deserializePopulatedTransaction = (
  serializedTransaction: string,
): PopulatedTransaction => {
  try {
    return JSON.parse(serializedTransaction);
  } catch (err: any) {
    throw new Error('Could not deserialize PopulatedTransaction.');
  }
};
