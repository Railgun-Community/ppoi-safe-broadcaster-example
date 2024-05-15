export interface BroadcasterError extends Error {
  name: string;
  cause?: string;
}

export interface BroadcasterErrorConstructor {
  new (message?: string, cause?: string): BroadcasterError;
  (message?: string, cause?: string): BroadcasterError;
}

// eslint-disable-next-line vars-on-top, no-var, import/no-mutable-exports
export var BroadcasterError: BroadcasterErrorConstructor;
