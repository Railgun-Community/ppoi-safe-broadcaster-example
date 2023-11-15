import { sanitizeError } from '@railgun-community/shared-models';
import { RelayerError } from '../models/error-models';

export enum ErrorMessage {
  BAD_TOKEN_FEE = 'Bad token fee.',
  FAILED_QUORUM = 'Gas Price was rejected as too low to guarantee inclusion into the next block.',
  GAS_PRICE_TOO_LOW = 'Gas price rejected as too low.',
  GAS_ESTIMATE_ERROR = 'Gas estimate error. Possible connection failure.',
  GAS_ESTIMATE_REVERT = 'Gas estimate error. Possible connection failure. Please try again.',
  TRANSACTION_SEND_TIMEOUT_ERROR = `WARNING: Timed out while sending to the blockchain. The transaction may be processing on-chain, but we can't find the receipt. This can occur when a Relayer has a connection issue. You will not see this transaction in your history, but your balance will reflect it if successful. We recommend waiting at least 15 minutes before trying again.`,
  TRANSACTION_SEND_RPC_ERROR = `WARNING: Relayer received an error while sending the transaction, The transaction may still be processing on-chain, but we can't find the receipt. This can occur when a Relayer has a connection issue. Your balance should reflect it if successful.  We recommend waiting at least 15 minutes before trying again.`,
  REPEAT_TRANSACTION = 'Transaction has already been sent.',
  UNSUPPORTED_NETWORK = `Relayer does not support this network.`,
  MISSING_REQUIRED_FIELD = `Missing required field.`,
  NO_RELAYER_FEE = 'No Relayer Fee included in transaction.',
  UNKNOWN_ERROR = 'Unknown Relayer error.',
  REJECTED_PACKAGED_FEE = 'Network Gas Price has changed dramatically and the Relayer Fee was rejected.',
  FAILED_TO_EXTRACT_PACKAGED_FEE = 'Failed to extract Relayer Fee from transaction. Please try again.',
  RELAYER_OUT_OF_GAS = 'Relayer is out of gas, or currently does not have enough to process this transaction.',
  NOTE_ALREADY_SPENT = 'ALREADY SPENT: One of the notes contained in this transaction have already been spent!',
  TRANSACTION_UNDERPRICED = 'RPC Rejected Transction: Gas fee too low. Please select a higher gas price and resubmit.',
  POI_INVALID = 'Could not validate Proof of Innocence - Relayer cannot process this transaction.',
  NONCE_ALREADY_USED = 'WARNING: Relayer recieved an error from the RPC: Nonce already used. There is no way to tell if the transaction made it. We did not recieve a tx hash. Please check the chain, if nothing happens within 15 minutes. It is safe to try again.',
  MISSING_RESPONSE = 'RPC response is missing.',
  BAD_RESPONSE = 'Server responded 512. ',
}

const sanitizeEthersError = (errMessage: string) => {
  // Removes the content after "[ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (method="estimateGas", transaction={"from":"0x9E9F988356f46744Ee0374A17a5Fa1a3A3cC3777","to":"0x3ee8306321d992483BDC9c69B8F622Ba3FFF05B6","value": ......"
  return errMessage.split('[ See:')[0];
};

export const sanitizeRelayerError = (error: Error): Error => {
  const sanitized = sanitizeError(error);
  return new Error(sanitizeEthersError(sanitized.message));
};

export const customRelayerError = (message: string, errorSeen: Error) => {
  return new RelayerError(`CMsg_${message}`, errorSeen.message);
};
// will strip the message back to its original desired string.
export const sanitizeCustomRelayerError = (error: Error): Error => {
  const newErrorString = error.message.slice(5);
  return new Error(newErrorString);
};
