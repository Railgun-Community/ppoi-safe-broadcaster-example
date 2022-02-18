import { BaseProvider } from '@ethersproject/providers';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { Wallet as EthersWallet } from 'ethers';
import { isValidMnemonic } from 'ethers/lib/utils';
import { NetworkChainID } from '../config/config-chain-ids';
import configDefaults from '../config/config-defaults';
import { ActiveWallet } from '../../models/wallet-models';
import { resetArray } from '../../util/utils';
import { getLepton } from '../lepton/lepton-init';
import { getWallets } from './wallet-config';

const activeWallets: ActiveWallet[] = [];

let shieldedReceiverWallet: RailgunWallet;

const RAILGUN_ADDRESS_INDEX = 0;

export const resetWallets = () => {
  resetArray(activeWallets);
};

const initShieldedReceiverWallet = async (mnemonic: string) => {
  const lepton = getLepton();
  const encryptionKey = configDefaults.lepton.dbEncryptionKey;
  if (!encryptionKey) {
    throw Error(
      'DB_ENCRYPTION_KEY not set (use docker secret, or env-cmdrc for insecure testing)',
    );
  }
  const walletID = await lepton.createWalletFromMnemonic(
    encryptionKey,
    mnemonic,
  );
  shieldedReceiverWallet = lepton.wallets[walletID];
};

export const getActiveReceiverWallet = (): ActiveWallet => {
  const receiverWallets = activeWallets.filter(
    (wallet) => wallet.isShieldedReceiver,
  );
  if (receiverWallets.length !== 1) {
    throw new Error(
      'Requires one receiver wallet. Add `isShieldedReceiver` boolean value to one of your configured wallets',
    );
  }
  return receiverWallets[0];
};

export const initWallets = async () => {
  resetWallets();
  getWallets().forEach(({ mnemonic, priority, isShieldedReceiver }) => {
    if (!isValidMnemonic(mnemonic)) {
      throw Error(
        'Invalid or missing MNEMONIC (use docker secret or insecure env-cmdrc for testing)',
      );
    }
    const wallet = EthersWallet.fromMnemonic(mnemonic);
    activeWallets.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic,
      priority,
      isShieldedReceiver: isShieldedReceiver === true,
    });
  });
  const activeReceiverWallet = getActiveReceiverWallet();
  await initShieldedReceiverWallet(activeReceiverWallet.mnemonic);
};

export const getShieldedReceiverWallet = (): RailgunWallet => {
  if (!shieldedReceiverWallet) {
    throw new Error(
      'No receiver wallet configured. Please add `isShieldedReceiver` boolean value to one of your configured wallets.',
    );
  }
  return shieldedReceiverWallet;
};

export const getRailgunWalletKeypair = (
  chainID: NetworkChainID,
): {
  privateKey: string;
  pubkey: string;
  address: string;
} => {
  const index = 0;
  const change = false;
  return getShieldedReceiverWallet().getKeypair(
    configDefaults.lepton.dbEncryptionKey,
    index,
    change,
    chainID,
  );
};

export const getRailgunWalletPubKey = () => {
  const chainID = 0;
  return getRailgunWalletKeypair(chainID).pubkey;
};

export const getRailgunAddress = (chainID?: NetworkChainID) => {
  const change = false;
  return getShieldedReceiverWallet().getAddress(
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

export const getActiveWallets = (): ActiveWallet[] => {
  if (activeWallets.length < 1) {
    throw new Error('No wallets initialized.');
  }
  return activeWallets;
};
