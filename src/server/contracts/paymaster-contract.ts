import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import { RelayerSignedPreAuthorization } from '@railgun-community/shared-models';
import {
  Paymaster,
  PreAuthorizationStruct,
} from './typechain/contracts/paymaster/Paymaster';
// TODO: Add Paymaster ABI from final contract.
import ABIPaymaster from './abi/Paymaster.json';
import { logger } from '../../util/logger';

export class PaymasterContract {
  private readonly contract: Paymaster;

  readonly address: string;

  constructor(paymasterContractAddress: string, provider: Provider) {
    this.address = paymasterContractAddress;
    this.contract = new Contract(
      paymasterContractAddress,
      ABIPaymaster,
      provider,
    ) as Paymaster;
  }

  static getABI() {
    return ABIPaymaster;
  }

  async balance(paymasterAddress: string): Promise<BigNumber> {
    return this.contract.balance(paymasterAddress);
  }

  async createDeposit(
    paymasterAddress: string,
    amount: BigNumber,
  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.deposit(paymasterAddress, {
      value: amount,
    });
  }

  async createWithdrawal(amount: BigNumber): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.withdraw(amount);
  }

  async verifyPreAuthorization(
    paymasterAddress: string,
    signedPreAuthorization: RelayerSignedPreAuthorization,
  ): Promise<boolean> {
    try {
      await this.contract.verifyPreAuthorization(
        paymasterAddress,
        signedPreAuthorization,
      );
      return true;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }

  async createPaymasterTransactionsWithPreAuthorization(
    paymasterAddress: string,
    signedPreAuthorization: RelayerSignedPreAuthorization,
    transactions: any,
  ): Promise<PopulatedTransaction> {
    // TODO: Update this interface
    return this.contract.populateTransaction.callWithPreAuthorization(
      paymasterAddress,
      signedPreAuthorization,
      [],
    );
  }
}
