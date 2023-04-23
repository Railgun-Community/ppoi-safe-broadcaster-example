import { BigNumber } from '@ethersproject/bignumber';
import { logger } from '../../util/logger';
import { throwErr } from '../../util/promise-utils';
import { RelayerChain } from '../../models/chain-models';
import { ContractStore } from '../contracts/contract-store';

export const getPaymasterGasBalance = async (
  chain: RelayerChain,
  walletAddress: string,
): Promise<Optional<BigNumber>> => {
  try {
    const paymasterContract = ContractStore.getPaymasterContract(chain);
    const balance = await paymasterContract
      .balance(walletAddress)
      .catch(throwErr);
    return balance;
  } catch (err) {
    logger.error(
      new Error(`Could not get paymaster gas balance: ${err.message}`),
    );
    return undefined;
  }
};
