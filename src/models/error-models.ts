export interface RelayerError extends Error {
  name: string;
  cause?: string;
}

export interface RelayerErrorConstructor {
  new (message?: string, cause?: string): RelayerError;
  (message?: string, cause?: string): RelayerError;
}

// eslint-disable-next-line vars-on-top, no-var, import/no-mutable-exports
export var RelayerError: RelayerErrorConstructor;
