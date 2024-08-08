import {
  ByteLength,
  POIRequired,
  POIValidator,
  ByteUtils,
} from '@railgun-community/wallet';
import { BroadcasterChain } from '../../models/chain-models';
import {
  PreTransactionPOIsPerTxidLeafPerList,
  TXIDVersion,
  isDefined,
  networkForChain,
} from '@railgun-community/shared-models';
import debug from 'debug';
import { ErrorMessage } from '../../util/errors';
import { ContractTransaction } from 'ethers';
import { getRailgunWalletID } from '../wallets/active-wallets';
import {
  ReliabilityMetric,
  incrementReliability,
} from '../../util/reliability';

const dbg = debug('broadcaster:poi-validator');

export type ValidatedPOIData = {
  railgunTxid: string;
  utxoTreeIn: number;
  notePublicKey: string;
  commitment: string;
  preTransactionPOIsPerTxidLeafPerList: PreTransactionPOIsPerTxidLeafPerList;
};

// DO NOT MODIFY.
// WARNING: If you modify POI validation, you risk fees that aren't spendable, as they won't have valid POIs.
export const validatePOI = async (
  txidVersion: TXIDVersion,
  chain: BroadcasterChain,
  transactionRequest: ContractTransaction,
  useRelayAdapt: boolean,
  preTransactionPOIsPerTxidLeafPerList: PreTransactionPOIsPerTxidLeafPerList,
): Promise<Optional<ValidatedPOIData>> => {
  try {
    const network = networkForChain(chain);
    if (!network) {
      throw new Error('Network not found');
    }
    const isRequired = await POIRequired.isRequiredForNetwork(network.name);
    if (!isRequired) {
      // Not required - valid by default.
      return;
    }

    const railgunWalletID = getRailgunWalletID();

    const { isValid, error, extractedRailgunTransactionData } =
      await POIValidator.isValidSpendableTransaction(
        railgunWalletID,
        txidVersion,
        chain,
        transactionRequest,
        useRelayAdapt,
        preTransactionPOIsPerTxidLeafPerList,
      );
    if (!isValid) {
      // Invalid POIs.
      throw new Error(`Invalid POIs for spendability - ${error}`);
    }
    if (!isDefined(extractedRailgunTransactionData)) {
      throw new Error('No extracted data from POI validation');
    }
    const feeTransactionData = extractedRailgunTransactionData.find(
      (transactionData) => {
        return (
          isDefined(transactionData.firstCommitment) &&
          isDefined(transactionData.firstCommitmentNotePublicKey)
        );
      },
    );
    if (!isDefined(feeTransactionData)) {
      throw new Error('No extracted fee transaction data found');
    }

    // Valid POI. Continue.
    const validatedPOIData: ValidatedPOIData = {
      railgunTxid: feeTransactionData.railgunTxid,
      utxoTreeIn: Number(feeTransactionData.utxoTreeIn),
      notePublicKey: ByteUtils.nToHex(
        feeTransactionData.firstCommitmentNotePublicKey as bigint,
        ByteLength.UINT_256,
        true,
      ),
      commitment: feeTransactionData.firstCommitment as string,
      preTransactionPOIsPerTxidLeafPerList,
    };
    return validatedPOIData;
  } catch (err) {
    console.log(err);
    dbg(`Could not validate POI for transaction - ${err.message}`);
    throw new Error(ErrorMessage.POI_INVALID);
  }
};
