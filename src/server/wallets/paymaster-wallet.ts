import { RelayerChain } from '../../models/chain-models';
import {
  getCachedPaymasterGasBalance,
  updateCachedPaymasterGasBalance,
} from '../balances/paymaster-gas-balance-cache';
import { logger } from '../../util/logger';
import { Wallet } from '@ethersproject/wallet';
import { BigNumber } from '@ethersproject/bignumber';
import { RelayerPreAuthorization } from '@railgun-community/shared-models';
import { ContractStore } from '../contracts/contract-store';
import { getProviderForNetwork } from '../providers/active-network-providers';

export const TYPES_PAYMASTER_PRE_AUTHORIZE = {
  RailgunPaymasterAuthorization: [
    { name: 'gasLimit', type: 'uint256' },
    { name: 'commitmentHash', type: 'bytes32' },
    { name: 'expiration', type: 'uint256' },
  ],
};

export class PaymasterWallet {
  private static paymasterWallet: Optional<Wallet>;

  static setPaymasterWallet(wallet: Wallet) {
    this.paymasterWallet = wallet;
  }

  static async signPaymasterPreAuthorize(
    chain: RelayerChain,
    preAuthorization: RelayerPreAuthorization,
  ): Promise<string> {
    const wallet = this.getPaymasterWallet(chain);
    const { address: paymasterContractAddress } =
      ContractStore.getPaymasterContract(chain);
    const domain = this.getDomain(chain, paymasterContractAddress);
    const data = this.getPaymasterPreAuthorizationDataField(preAuthorization);

    // eslint-disable-next-line no-underscore-dangle
    const signature = await wallet._signTypedData(
      domain,
      TYPES_PAYMASTER_PRE_AUTHORIZE,
      data,
    );

    return signature;
  }

  static getPaymasterPreAuthorizationDataField(
    preAuthorization: RelayerPreAuthorization,
  ) {
    return {
      gasLimit: BigNumber.from(preAuthorization.gasLimit),
      commitmentHash: preAuthorization.commitmentHash,
      expiration: preAuthorization.expiration,
    };
  }

  static getDomain(chain: RelayerChain, paymasterContract: string) {
    return {
      chainId: chain.id,
      verifyingContract: paymasterContract,
    };
  }

  static getPaymasterWallet(chain: RelayerChain) {
    if (!this.paymasterWallet) {
      throw new Error('No Paymaster wallet set.');
    }
    const provider = getProviderForNetwork(chain);
    return new Wallet(this.paymasterWallet, provider);
  }

  static async getGasBalance(chain: RelayerChain): Promise<BigNumber> {
    const { address } = this.getPaymasterWallet(chain);
    const balance = await getCachedPaymasterGasBalance(chain, address);
    return balance;
  }

  static async updateGasBalance(chain: RelayerChain): Promise<void> {
    try {
      const { address } = this.getPaymasterWallet(chain);
      await updateCachedPaymasterGasBalance(chain, address);
    } catch (err) {
      logger.error(err);
    }
  }

  static async hasEnoughPaymasterGas(
    chain: RelayerChain,
    minimumGas: BigNumber,
  ): Promise<boolean> {
    const balance = await PaymasterWallet.getGasBalance(chain);
    return balance.gte(minimumGas);
  }
}
