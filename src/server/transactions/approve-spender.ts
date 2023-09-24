import { Contract, ContractTransaction, TransactionResponse } from 'ethers';
import { ERC20Amount } from '../../models/token-models';
import { ABI_ERC20 } from '../abi/abi';
import { zeroXExchangeProxyContractAddress } from '../api/0x/0x-quote';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { ActiveWallet } from '../../models/wallet-models';
import { getEstimateGasDetailsPublic } from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { removeUndefineds } from '../../util/utils';
import debug from 'debug';
import { RelayerChain } from '../../models/chain-models';
import {
  getEVMGasTypeForTransaction,
  networkForChain,
} from '@railgun-community/shared-models';

const dbg = debug('relayer:approvals');

export const MAX_UINT_ALLOWANCE = 2n ** 256n - 1n;

export const cachedApprovedTokens: string[] = [];

export const generateApprovalTransactions = async (
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
  sender: string,
): Promise<ContractTransaction[]> => {
  const populatedTransactions: Optional<ContractTransaction>[] = [];

  for (const tokenAmount of erc20Amounts) {
    try {
      const provider = getProviderForNetwork(chain);
      const contract = new Contract(
        tokenAmount.tokenAddress,
        ABI_ERC20,
        provider,
      );

      const spender = zeroXExchangeProxyContractAddress(chain);

      // eslint-disable-next-line no-await-in-loop
      const allowance: bigint = await contract.allowance(sender, spender);
      if (allowance >= tokenAmount.amount) {
        dbg('Enough Allowance granted already');
        continue;
      }
      dbg('We dont have enough allowance, set it max');
      // approve for infinite approval
      dbg(allowance);
      dbg(MAX_UINT_ALLOWANCE);

      // eslint-disable-next-line no-await-in-loop
      const populatedTransaction = await contract.approve.populateTransaction(
        spender,
        MAX_UINT_ALLOWANCE,
      );
      populatedTransaction.from = sender;
      populatedTransactions.push(populatedTransaction);
    } catch (err: any) {
      dbg(`Could not populate transaction for some token: ${err.message}`);
    }
  }

  return removeUndefineds(populatedTransactions);
};

export const approveZeroX = async (
  activeWallet: ActiveWallet,
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
): Promise<TransactionResponse[]> => {
  const populatedApprovalTXs = await generateApprovalTransactions(
    erc20Amounts,
    chain,
    activeWallet.address,
  );
  const TransactionResponses: TransactionResponse[] = [];
  // switch this to async
  for (const populatedApproval of populatedApprovalTXs) {
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
      populatedApproval,
    );
    // eslint-disable-next-line no-await-in-loop
    const txResponse = await executeTransaction(
      chain,
      populatedApproval,
      gasDetails,
      activeWallet,
      undefined, // overrideNonce
      false, // setAvailability
      false, // setTxCached
    );
    // return txResponse;
    TransactionResponses.push(txResponse);
  }
  return removeUndefineds(TransactionResponses);
};
