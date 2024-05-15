import { Contract, ContractTransaction, TransactionResponse } from 'ethers';
import { ERC20Amount } from '../../models/token-models';
import { getEstimateGasDetailsPublic } from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { ActiveWallet } from '../../models/wallet-models';
import debug from 'debug';
import { removeUndefineds } from '../../util/utils';
import { RelayerChain } from '../../models/chain-models';
import {
  getEVMGasTypeForTransaction,
  networkForChain,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import { getProviderForNetwork } from '../providers/active-network-providers';

const dbg = debug('broadcaster:native-unwrap');

export const generateUnwrapTransactions = async (
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
): Promise<ContractTransaction[]> => {
  const populatedTransactions: Optional<ContractTransaction>[] = [];

  for (const erc20Amount of erc20Amounts) {
    try {
      const provider = getProviderForNetwork(chain);
      const contract = new Contract(
        erc20Amount.tokenAddress,
        ['function withdraw(uint256 wad)'],
        provider,
      );

      // eslint-disable-next-line no-await-in-loop
      const populatedTransaction = await contract.withdraw.populateTransaction(
        erc20Amount.amount,
      );
      populatedTransactions.push(populatedTransaction);
    } catch (err: any) {
      dbg(
        `Could not populate transaction for token ${erc20Amount.tokenAddress} being unwrapped for top up: ${err.message}`,
      );
    }
  }

  return removeUndefineds(populatedTransactions);
};

export const nativeUnwrap = async (
  activeWallet: ActiveWallet,
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
): Promise<TransactionResponse[]> => {
  const populatedUnwrapTXs = await generateUnwrapTransactions(
    erc20Amounts,
    chain,
  );
  const transactionResponses: TransactionResponse[] = [];
  for (const populatedSwap of populatedUnwrapTXs) {
    const network = networkForChain(chain);
    if (!network) {
      throw new Error(
        `Unsupported network for chain ${chain.type}:${chain.id}`,
      );
    }
    const sendWithPublicWallet = true;
    const evmGasType = getEVMGasTypeForTransaction(
      network.name,
      sendWithPublicWallet,
    );
    populatedSwap.from = activeWallet.address;
    // eslint-disable-next-line no-await-in-loop
    const gasDetails = await getEstimateGasDetailsPublic(
      chain,
      evmGasType,
      populatedSwap,
    );
    // eslint-disable-next-line no-await-in-loop
    const txResponse = await executeTransaction(
      chain,
      populatedSwap,
      gasDetails,
      undefined, // txidVersion
      undefined, // validatedPOIData
      activeWallet,
      undefined, // overrideNonce
      false, // setAvailability
      false, // setTxCached
    );
    transactionResponses.push(txResponse);
  }

  return transactionResponses;
};

export const gasEstimateNativeUnwrap = async (
  activeWallet: ActiveWallet,
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
): Promise<TransactionGasDetails[]> => {
  const populatedUnwrapTXs = await generateUnwrapTransactions(
    erc20Amounts,
    chain,
  );
  const transactionResponses: TransactionGasDetails[] = [];
  for (const populatedSwap of populatedUnwrapTXs) {
    const network = networkForChain(chain);
    if (!network) {
      throw new Error(
        `Unsupported network for chain ${chain.type}:${chain.id}`,
      );
    }
    const sendWithPublicWallet = true;
    const evmGasType = getEVMGasTypeForTransaction(
      network.name,
      sendWithPublicWallet,
    );
    // eslint-disable-next-line no-await-in-loop
    const gasDetails = await getEstimateGasDetailsPublic(
      chain,
      evmGasType,
      populatedSwap,
    );
    transactionResponses.push(gasDetails);
  }

  return transactionResponses;
};
