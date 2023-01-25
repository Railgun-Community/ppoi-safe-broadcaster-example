import { sanitizeError } from '@railgun-community/shared-models';

export enum ErrorMessage {
  BAD_TOKEN_FEE = 'Bad token fee.',
  GAS_PRICE_TOO_LOW = 'Gas price rejected as too low.',
  GAS_ESTIMATE_ERROR = 'Gas estimate error. Possible connection failure.',
  TRANSACTION_SEND_TIMEOUT_ERROR = `WARNING: Timed out while sending to the blockchain. The transaction may be processing on-chain, but we can't find the receipt. This can occur when a Relayer has a connection issue. You will not see this transaction in your history, but your balance will reflect it if successful. We recommend waiting at least 15 minutes before trying again.`,
  UNSUPPORTED_NETWORK = `Relayer does not support this network.`,
  MISSING_REQUIRED_FIELD = `Missing required field.`,
  NO_RELAYER_FEE = 'No Relayer Fee included in transaction.',
  UNKNOWN_ERROR = 'Unknown Relayer error.',
}

const sanitizeEthersError = (errMessage: string) => {
  // Removes the content after "[ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (method="estimateGas", transaction={"from":"0x9E9F988356f46744Ee0374A17a5Fa1a3A3cC3777","to":"0x3ee8306321d992483BDC9c69B8F622Ba3FFF05B6","value": ......"
  return errMessage.split('[ See:')[0];
};

export const sanitizeRelayerError = (error: Error): Error => {
  const sanitized = sanitizeError(error);
  return new Error(sanitizeEthersError(sanitized.message));
};
