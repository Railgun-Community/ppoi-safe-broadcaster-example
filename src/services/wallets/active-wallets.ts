import { BaseProvider } from '@ethersproject/providers';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { Wallet as EthersWallet } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configDefaults from '../../config/config-defaults';
import configWallets from '../../config/config-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import { getLepton } from '../lepton/lepton-init';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { isWalletAvailable } from './available-wallets';

const activeWallets: ActiveWallet[] = [];

let shieldedReceiverWallet: RailgunWallet;

const RAILGUN_ADDRESS_INDEX = 0;

export const initWallets = async () => {
  configWallets.wallets.forEach(
    async ({ mnemonic, priority, isShieldedReceiver }) => {
      const wallet = EthersWallet.fromMnemonic(mnemonic);
      activeWallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        priority,
      });
      if (isShieldedReceiver) {
        await initShieldedReceiverWallet(mnemonic);
      }
    },
  );
};

const initShieldedReceiverWallet = async (mnemonic: string) => {
  const lepton = getLepton();
  const walletID = await lepton.createWalletFromMnemonic(
    configDefaults.leptonDbEncryptionKey,
    mnemonic,
  );
  shieldedReceiverWallet = lepton.wallets[walletID];
};

export const getRailgunAddress = (chainID?: NetworkChainID) => {
  if (!shieldedReceiverWallet) {
    throw new Error(
      'No receiver wallet configured. Please add `isShieldedReceiver` boolean value to one of your wallets.',
    );
  }
  const change = false;
  return shieldedReceiverWallet.getAddress(
    RAILGUN_ADDRESS_INDEX,
    change,
    chainID,
  );
};

export const createEthersWallet = (
  activeWallet: ActiveWallet,
  provider: BaseProvider,
): EthersWallet => {
  return new EthersWallet(activeWallet.privateKey, provider);
};

export const getFirstActiveWallet = (): ActiveWallet => {
  if (activeWallets.length < 1) {
    throw new Error('No wallets initialized.');
  }
  return activeWallets[0];
};

export const getBestWalletForNetwork = (
  chainID: NetworkChainID,
): EthersWallet => {
  // Simple sort:
  // - Availability (isProcessing).
  // - Priority.
  // - Amount of (gas token) available (TODO).
  const sortedAvailableWallets = activeWallets
    .filter((wallet) => isWalletAvailable(wallet))
    .sort((a, b) => {
      // Sort ascending by priority.
      return a.priority - b.priority;
    });

  if (sortedAvailableWallets.length < 1) {
    throw new Error('No wallets available.');
  }

  const bestWallet = sortedAvailableWallets[0];
  const provider = getProviderForNetwork(chainID);
  return new EthersWallet(bestWallet.privateKey, provider);
};
