import { TransactionResponse } from '@ethersproject/providers';
import { Contract, PopulatedTransaction } from 'ethers';
import { TokenAmount } from '../../models/token-models';
import { abiForChainToken } from '../abi/abi';
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
  tokenAmounts: TokenAmount[],
  chain: RelayerChain,
): Promise<PopulatedTransaction[]> => {
  const populatedTransactions: Optional<PopulatedTransaction>[] =
    await Promise.all(
      tokenAmounts.map(async (tokenAmount) => {
        try {
          const abi = abiForChainToken(chain);
          const provider = getProviderForNetwork(chain);
          const contract = new Contract(
            tokenAmount.tokenAddress,
            abi,
            provider,
          );
          const approvalAmount = tokenAmount.amount;
          const value = approvalAmount.toHexString();
          const spender = zeroXExchangeProxyContractAddress(chain);
          return await contract.populateTransaction.approve(spender, value);
        } catch (err: any) {
          dbg(`Could not populate transaction for some token: ${err.message}`);
          return undefined;
        }
      }),
    );

  return removeUndefineds(populatedTransactions);
};

export const approveZeroX = async (
  activeWallet: ActiveWallet,
  tokenAmounts: TokenAmount[],
  chain: RelayerChain,
): Promise<TransactionResponse[]> => {
  const populatedApprovalTXs = await generateApprovalTransactions(
    tokenAmounts,
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
