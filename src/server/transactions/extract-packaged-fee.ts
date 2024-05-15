import { BroadcasterChain } from '../../models/chain-models';
import {
  extractFirstNoteERC20AmountMapFromTransactionRequest,
  parseRailgunTokenAddress,
} from '@railgun-community/wallet';
import { TXIDVersion, networkForChain } from '@railgun-community/shared-models';
import { getRailgunWalletID } from '../wallets/active-wallets';
import { ErrorMessage } from '../../util/errors';
import { ContractTransaction } from 'ethers';
import { promiseTimeout } from '../../util/promise-utils';

type PackagedFee = {
  tokenAddress: string;
  packagedFeeAmount: bigint;
};

export const extractPackagedFeeFromTransaction = async (
  txidVersion: TXIDVersion,
  chain: BroadcasterChain,
  transaction: ContractTransaction,
  useRelayAdapt: boolean,
): Promise<PackagedFee> => {
  const network = networkForChain(chain);
  if (!network) {
    throw new Error(`No network for chain ${chain.type}:${chain.id}`);
  }

  const railgunWalletID = getRailgunWalletID();

  let firstNoteERC20Map;
  try {
    firstNoteERC20Map = await promiseTimeout(
      extractFirstNoteERC20AmountMapFromTransactionRequest(
        railgunWalletID,
        txidVersion,
        network,
        transaction,
        useRelayAdapt,
      ),
      60 * 1000,
    );
  } catch (err) {
    throw new Error(ErrorMessage.FAILED_TO_EXTRACT_PACKAGED_FEE);
  }

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
