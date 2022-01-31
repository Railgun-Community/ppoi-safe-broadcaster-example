import { WalletsConfig } from '../models/config-models';
import { WalletConfig } from '../models/wallet-models';

const wallets: WalletConfig[] = [
  {
    mnemonic: 'test test test test test test test test test test test junk',
    priority: 1,
  },
];

export default { wallets } as WalletsConfig;
