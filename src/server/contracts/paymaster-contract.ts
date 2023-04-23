import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import { RelayerSignedPreAuthorization } from '@railgun-community/shared-models';
import { Paymaster } from './typechain/contracts/paymaster/Paymaster';
// TODO: Add Paymaster ABI from final contract.
import ABIPaymaster from './abi/Paymaster.json';

export class PaymasterContract {
  private readonly contract: Paymaster;

  readonly address: string;

  constructor(relayAdaptContractAddress: string, provider: Provider) {
    this.address = relayAdaptContractAddress;
    this.contract = new Contract(
      relayAdaptContractAddress,
      ABIPaymaster,
      provider,
    ) as Paymaster;
  }

  static getABI() {
    return ABIPaymaster;
  }

  async balance(walletAddress: string): Promise<BigNumber> {
    return this.contract.balance(walletAddress);
  }

  async createDeposit(
    paymasterWalletAddress: string,
    amount: BigNumber,
  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.deposit(paymasterWalletAddress, {
      value: amount,
    });
  }

  async createWithdrawal(amount: BigNumber): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.withdraw(amount);
  }

  async verifyPreAuthorization(
    signedPreAuthorization: RelayerSignedPreAuthorization,
  ): Promise<void> {
    // TODO: Update this interface.
    // @ts-ignore
    return this.contract.verifyPreAuthorization(signedPreAuthorization);
  }

  async callWithPreAuthorization(
    signedPreAuthorization: RelayerSignedPreAuthorization,
    callData: string,
  ): Promise<void> {
    // TODO: Update this interface.
    // @ts-ignore
    return this.contract.callWithPreAuthorization(
      signedPreAuthorization,
      callData,
    );
  }
}
