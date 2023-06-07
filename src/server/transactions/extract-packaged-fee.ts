import { RelayerChain } from '../../models/chain-models';
import {
  extractFirstNoteERC20AmountMapFromTransactionRequest,
  parseRailgunTokenAddress,
} from '@railgun-community/wallet';
import { networkForChain } from '@railgun-community/shared-models';
import { getRailgunWalletID } from '../wallets/active-wallets';
import { ErrorMessage } from '../../util/errors';
import { ContractTransaction } from 'ethers';

type PackagedFee = {
  tokenAddress: string;
  packagedFeeAmount: bigint;
};

export const extractPackagedFeeFromTransaction = async (
  chain: RelayerChain,
  transaction: ContractTransaction,
  useRelayAdapt: boolean,
): Promise<PackagedFee> => {
  const network = networkForChain(chain);
  if (!network) {
    throw new Error(`No network for chain ${chain.type}:${chain.id}`);
  }

  const railgunWalletID = getRailgunWalletID();

  const firstNoteERC20Map =
    await extractFirstNoteERC20AmountMapFromTransactionRequest(
      railgunWalletID,
      network,
      transaction,
      useRelayAdapt,
    );

  const tokens = Object.keys(firstNoteERC20Map);
  if (tokens.length < 1) {
    throw new Error(ErrorMessage.NO_RELAYER_FEE);
  }

  const tokenAddress = parseRailgunTokenAddress(tokens[0]).toLowerCase();

  // Return first payment.
  return {
    tokenAddress,
    packagedFeeAmount: firstNoteERC20Map[tokens[0]],
  };
};
