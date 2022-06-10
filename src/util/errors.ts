export enum ErrorMessage {
  BAD_TOKEN_FEE = 'Bad token fee.',
  GAS_ESTIMATE_ERROR = 'Gas estimate error. Possible connection failure.',
  TRANSACTION_SEND_TIMEOUT_ERROR = `WARNING: Timed out while sending to the blockchain. The transaction may be processing on-chain, but we didn't get a receipt. This can occur when a Relayer has a connection issue. You will not see this transaction in your history, but your balance will reflect it if successful. We recommend waiting at least one hour before trying again.`,
  UNKNOWN_ERROR = 'Unknown Relayer error.',
}
