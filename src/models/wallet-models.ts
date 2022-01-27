export type WalletConfig = {
  mnemonic: string;
  isShieldedReceiver?: boolean;
};

export type ActiveWallet = {
  address: string;
  privateKey: string;
};
