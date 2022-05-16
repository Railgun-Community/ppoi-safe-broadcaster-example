export enum ErrorMessage {
  BAD_TOKEN_FEE = 'Bad token fee.',
  GAS_ESTIMATE_ERROR = 'Gas estimate error. Possible connection failure.',
  TRANSACTION_SEND_TIMEOUT_ERROR = `WARNING: Timed out while sending to the blockchain. The transaction may be processing on-chain, but we didn't get a receipt. Please check your private balance in a few minutes.`,
  UNKNOWN_ERROR = 'Unknown Relayer error.',
}
