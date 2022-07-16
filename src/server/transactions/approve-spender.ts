import { TransactionResponse } from '@ethersproject/providers';
import { Contract, PopulatedTransaction } from 'ethers';
import { TokenAmount } from '../../models/token-models';
import { abiForChainToken } from '../abi/abi';
import { zeroXExchangeProxyContractAddress } from '../api/0x/0x-quote';
import { NetworkChainID } from '../config/config-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { ActiveWallet } from '../../models/wallet-models';
import { getEstimateGasDetails } from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { removeUndefineds } from '../../util/utils';
import debug from 'debug';

const dbg = debug('relayer:approvals');

export const generateApprovalTransactions = async (
  tokenAmounts: TokenAmount[],
  chainID: NetworkChainID,
): Promise<PopulatedTransaction[]> => {
  const populatedTransactions: Optional<PopulatedTransaction>[] =
    await Promise.all(
      tokenAmounts.map(async (tokenAmount) => {
        try {
          const abi = abiForChainToken(chainID);
          const provider = getProviderForNetwork(chainID);
          const contract = new Contract(
            tokenAmount.tokenAddress,
            abi,
            provider,
          );
          const approvalAmount = tokenAmount.amount;
          const value = approvalAmount.toHexString();
          const spender = zeroXExchangeProxyContractAddress(chainID);
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
  chainID: NetworkChainID,
): Promise<TransactionResponse[]> => {
  const populatedApprovalTXs = await generateApprovalTransactions(
    tokenAmounts,
    chainID,
  );
  const TransactionResponses: TransactionResponse[] = await Promise.all(
    populatedApprovalTXs.map(async (populatedApproval) => {
      const gasDetails = await getEstimateGasDetails(
        chainID,
        populatedApproval,
      );
      const txResponse = await executeTransaction(
        chainID,
        populatedApproval,
        gasDetails,
        activeWallet,
      );
      return txResponse;
    }),
  );
  return removeUndefineds(TransactionResponses);
};
