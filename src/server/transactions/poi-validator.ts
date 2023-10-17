import {
  POIRequired,
  POIValidation,
  // POIValidation
} from '@railgun-community/wallet';
import { RelayerChain } from '../../models/chain-models';
import {
  PreTransactionPOIsPerTxidLeafPerList,
  TXIDVersion,
  networkForChain,
} from '@railgun-community/shared-models';
import debug from 'debug';
import { ErrorMessage } from '../../util/errors';
import { ContractTransaction } from 'ethers';

const dbg = debug('relayer:poi-validator');

// DO NOT MODIFY.
// WARNING: If you modify POI validation, you risk fees that aren't spendable, as they won't have valid POIs.
export const validatePOI = async (
  txidVersion: TXIDVersion,
  chain: RelayerChain,
  transactionRequest: ContractTransaction,
  useRelayAdapt: boolean,
  preTransactionPOIsPerTxidLeafPerList: PreTransactionPOIsPerTxidLeafPerList,
): Promise<void> => {
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

    const { isValid, error } = await POIValidation.isValidSpendableTXID(
      txidVersion,
      chain,
      transactionRequest,
      useRelayAdapt,
      preTransactionPOIsPerTxidLeafPerList,
    );
    if (!isValid) {
      // Invalid POIs.
      throw new Error(`Invalid POIs - ${error}`);
    }

    // Valid POI. Continue.
  } catch (err) {
    dbg(`Could not validate POI for transaction - ${err.message}`);
    throw new Error(ErrorMessage.POI_INVALID);
  }
};
