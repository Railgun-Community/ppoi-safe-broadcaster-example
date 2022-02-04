import { BaseProvider } from '@ethersproject/providers';
import { babyjubjub } from '@railgun-community/lepton/dist/utils';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { Wallet as EthersWallet } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configDefaults from '../../config/config-defaults';
import configWallets from '../../config/config-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import { resetArray } from '../../util/utils';
import { getLepton } from '../lepton/lepton-init';

const activeWallets: ActiveWallet[] = [];

let shieldedReceiverWallet: RailgunWallet;

const RAILGUN_ADDRESS_INDEX = 0;

export const initWallets = async () => {
  resetWallets();
  configWallets.wallets.forEach(
    async ({ mnemonic, priority, isShieldedReceiver }) => {
      const wallet = EthersWallet.fromMnemonic(mnemonic);
      activeWallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic,
        priority,
        isShieldedReceiver: isShieldedReceiver === true,
      });
    },
  );
  const activeReceiverWallet = getActiveReceiverWallet();
  await initShieldedReceiverWallet(activeReceiverWallet.mnemonic);
};

export const resetWallets = () => {
  resetArray(activeWallets);
};

const initShieldedReceiverWallet = async (mnemonic: string) => {
  const lepton = getLepton();
  const walletID = await lepton.createWalletFromMnemonic(
    configDefaults.leptonDbEncryptionKey,
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

export const getActiveReceiverWalletPublicKey = (): string => {
  const privateKey = getActiveReceiverWallet().privateKey;
  return babyjubjub.privateKeyToPubKey(privateKey);
};

export const getShieldedReceiverWallet = (): RailgunWallet => {
  if (!shieldedReceiverWallet) {
    throw new Error(
      'No receiver wallet configured. Please add `isShieldedReceiver` boolean value to one of your configured wallets.',
    );
  }
  return shieldedReceiverWallet;
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
