import { WalletsConfig } from '../../models/config-models';
import { WalletConfig } from '../../models/wallet-models';

import configDefaults from './config-defaults';

const wallets: WalletConfig[] = [
  {
    mnemonic: configDefaults.mnemonic,
    priority: 1,
    isShieldedReceiver: true,
  },
];

export default { wallets } as WalletsConfig;
