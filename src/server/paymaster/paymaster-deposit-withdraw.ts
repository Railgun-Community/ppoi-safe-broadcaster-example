import { BigNumber } from '@ethersproject/bignumber';
import { RelayerChain } from '../../models/chain-models';
import { ActiveWallet } from '../../models/wallet-models';
import { ContractStore } from '../contracts/contract-store';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { createEthersWallet } from '../wallets/active-wallets';
import { PaymasterWallet } from '../wallets/paymaster-wallet';
import { TransactionResponse } from '@ethersproject/providers';
import { updateCachedGasTokenBalance } from '../balances/gas-balance-cache';

/**
 * Deposits ETH from any active wallet
 * into the Paymaster contract's ETH balance.
 */
export const depositToPaymaster = async (
  chain: RelayerChain,
  activeWallet: ActiveWallet,
  amount: BigNumber,
): Promise<TransactionResponse> => {
  try {
    const provider = getProviderForNetwork(chain);
    const wallet = createEthersWallet(activeWallet, provider);
    const paymasterContract = ContractStore.getPaymasterContract(chain);
    const paymasterWalletAddress =
      PaymasterWallet.getPaymasterWallet(chain).address;

    const transaction = await paymasterContract.createDeposit(
      paymasterWalletAddress,
      amount,
    );

    // TODO (later): Add gas settings for transaction request.

    const transactionResponse = await wallet.sendTransaction(transaction);

    await PaymasterWallet.updateGasBalance(chain);

    return transactionResponse;
  } catch (err) {
    throw new Error(`Failed to deposit to paymaster: ${err}`);
  }
};

/**
 * Withdraws ETH from Paymaster contract
 * into the Paymaster wallet's ETH balance.
 */
export const withdrawFromPaymaster = async (
  chain: RelayerChain,
  amount: BigNumber,
): Promise<TransactionResponse> => {
  try {
    const paymasterContract = ContractStore.getPaymasterContract(chain);

    const transaction = await paymasterContract.createWithdrawal(amount);

    // TODO (later): Add gas settings for transaction request.

    const paymasterWallet = PaymasterWallet.getPaymasterWallet(chain);

    const transactionResponse = await paymasterWallet.sendTransaction(
      transaction,
    );

    await PaymasterWallet.updateGasBalance(chain);
    await updateCachedGasTokenBalance(chain, paymasterWallet.address);

    return transactionResponse;
  } catch (err) {
    throw new Error(`Failed to withdraw from paymaster: ${err}`);
  }
};
