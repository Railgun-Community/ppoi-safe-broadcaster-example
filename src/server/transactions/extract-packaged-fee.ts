import { BigNumber } from 'ethers';
import { TransactionRequest } from '@ethersproject/providers';
import { RelayerChain } from '../../models/chain-models';
import {
  extractFirstNoteERC20AmountMapFromTransactionRequest,
  parseRailgunTokenAddress,
} from '@railgun-community/quickstart';
import { networkForChain } from '@railgun-community/shared-models';
import { getRailgunWalletID } from '../wallets/active-wallets';
import { ErrorMessage } from '../../util/errors';

type PackagedFee = {
  tokenAddress: string;
  packagedFeeAmount: BigNumber;
};

export const extractPackagedFeeFromTransaction = async (
  chain: RelayerChain,
  transactionRequest: TransactionRequest,
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
      transactionRequest,
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
