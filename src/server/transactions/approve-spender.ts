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

export const generateApprovalTransactions = async (
  erc20Amounts: ERC20Amount[],
  chain: RelayerChain,
): Promise<ContractTransaction[]> => {
  const populatedTransactions: Optional<ContractTransaction>[] =
    await Promise.all(
      erc20Amounts.map(async (erc20Amount) => {
        try {
          const provider = getProviderForNetwork(chain);
          const contract = new Contract(
            erc20Amount.tokenAddress,
            ABI_ERC20,
            provider,
          );
          const approvalAmount = erc20Amount.amount;
          const spender = zeroXExchangeProxyContractAddress(chain);
          return await contract.approve.populateTransaction(
            spender,
            approvalAmount,
          );
        } catch (err) {
          dbg(`Could not populate transaction for some token: ${err.message}`);
          return undefined;
        }
      }),
    );

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
  );
  const TransactionResponses: TransactionResponse[] = await Promise.all(
    populatedApprovalTXs.map(async (populatedApproval) => {
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

      const gasDetails = await getEstimateGasDetailsPublic(
        chain,
        evmGasType,
        populatedApproval,
      );
      const txResponse = await executeTransaction(
        chain,
        populatedApproval,
        gasDetails,
        activeWallet,
      );
      return txResponse;
    }),
  );
  return removeUndefineds(TransactionResponses);
};
