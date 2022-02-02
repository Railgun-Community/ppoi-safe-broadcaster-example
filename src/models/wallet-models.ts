export type WalletConfig = {
  mnemonic: string;
  priority: number;
  isShieldedReceiver?: boolean;
};

export type ActiveWallet = {
  address: string;
  mnemonic: string;
  privateKey: string;
  priority: number;
  isShieldedReceiver: boolean;
};
