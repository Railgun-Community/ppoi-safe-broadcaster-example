import { WalletConfig } from '../../models/wallet-models';
import configDefaults from '../config/config-defaults';

export const getWallets = (): WalletConfig[] => {
  return [
    {
      mnemonic: configDefaults.wallet.mnemonic,
      priority: 1,
      isShieldedReceiver: true,
    },
  ];
};
