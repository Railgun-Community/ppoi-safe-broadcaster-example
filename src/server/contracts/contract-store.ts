import { RelayerChain } from '../../models/chain-models';
import { PaymasterContract } from './paymaster-contract';

export class ContractStore {
  static readonly paymasterContracts: PaymasterContract[][] = [];

  static getPaymasterContract(chain: RelayerChain): PaymasterContract {
    try {
      return this.paymasterContracts[chain.type][chain.id];
    } catch {
      throw new Error(
        `No PaymasterContract loaded for network ${chain.type}:${chain.id}`,
      );
    }
  }
}
