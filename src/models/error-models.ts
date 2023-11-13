export interface RelayerError {
  name: string;
  message: string;
  stack?: string;
}
type RelayerErrorCause = {
  cause?: string | undefined;
};
export interface RelayerErrorConstructor {
  new (message?: string, seenError?: RelayerErrorCause): RelayerError;
  (message?: string, seenError?: RelayerErrorCause): RelayerError;
}
