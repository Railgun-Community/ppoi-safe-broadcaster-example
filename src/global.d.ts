declare type Optional<T> = T | undefined;
declare type MapType<T> = { [id: string]: T; };
declare type NumMapType<T> = { [index: number]: T; };

namespace NodeJS {
  interface ProcessEnv {
    WAKU_RPC_URL: string;
    HARDHAT_RPC_URL: string;
    LEPTON_DB: string; // location of leveldown db 'server.db'
    DEBUG: string; // filter for trace output, eg "relayer:*,waku:waku"


    // the following should be set via docker secrets but fallback to env is allowed
    DB_ENCRYPTION_KEY: string; // encrypts the
    MNEMONIC: string; // 12-workd wallet mnemonic phrase
  }
}
