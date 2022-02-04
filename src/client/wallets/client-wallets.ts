import { Wallet as EthersWallet } from 'ethers';
import clientConfigWallets from '../config/client-config-wallets';
import { NetworkChainID } from '../../server/config/config-chain-ids';
import { getProviderForNetwork } from '../../server/providers/active-network-providers';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { onBalancesUpdate } from '../balances/rail-balances';
import { getLepton } from '../../server/lepton/lepton-init';
import configDefaults from '../../server/config/config-defaults';
import { WalletConfig } from '../../models/wallet-models';

type ActiveClientWallet = {
  address: string;
  privateKey: string;
  mnemonic: string;
  railWalletID: string;
};

const activeClientWallets: ActiveClientWallet[] = [];

export const initClientWallets = async () => {
  const createWalletPromises = clientConfigWallets.wallets.map(
    async (wallet) => await createNewClientWallet(wallet),
  );
  await Promise.all(createWalletPromises);
};

const createNewClientWallet = async (walletConfig: WalletConfig) => {
  const { mnemonic } = walletConfig;
  const wallet = EthersWallet.fromMnemonic(mnemonic);
  const railWalletID = await initRailgunWallet(mnemonic);
  activeClientWallets.push({
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic,
    railWalletID,
  });
};

const subscribeToBalanceEvents = (wallet: RailgunWallet) => {
  wallet.on('scanned', () => onBalancesUpdate(wallet));
};

const initRailgunWallet = async (mnemonic: string) => {
  const lepton = getLepton();
  const walletID = await lepton.createWalletFromMnemonic(
    configDefaults.leptonDbEncryptionKey,
    mnemonic,
  );
  subscribeToBalanceEvents(lepton.wallets[walletID]);
  return walletID;
};

export const getEthersClientWalletForIndex = (
  index: number,
  chainID: NetworkChainID,
): EthersWallet => {
  if (activeClientWallets.length < index + 1) {
    throw new Error('Client wallet index out of bounds.');
  }
  const provider = getProviderForNetwork(chainID);
  return new EthersWallet(activeClientWallets[index].privateKey, provider);
};

export const getRailgunClientWalletForIndex = (
  index: number,
  chainID: NetworkChainID,
): RailgunWallet => {
  if (activeClientWallets.length < index + 1) {
    throw new Error('Client wallet index out of bounds.');
  }
  return getRailgunClientWalletForID(activeClientWallets[index].railWalletID);
};

export const getRailgunClientWalletForID = (railWalletID: string) => {
  const lepton = getLepton();
  return lepton.wallets[railWalletID];
};
