import { BaseProvider } from '@ethersproject/providers';
import { decode } from '@railgun-community/lepton/dist/keyderivation/bech32-encode';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { Wallet } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configDefaults from '../../config/config-defaults';
import configWallets from '../../config/config-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import { getLepton } from '../lepton/lepton-init';
import { getProviderForNetwork } from '../providers/active-network-providers';

const activeWallets: ActiveWallet[] = [];

let shieldedReceiverWallet: RailgunWallet;

let railgunAddressIndex = 0;

export const initWallets = async () => {
  configWallets.wallets.forEach(async ({ mnemonic, isShieldedReceiver }) => {
    const wallet = Wallet.fromMnemonic(mnemonic);
    activeWallets.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
    if (isShieldedReceiver) {
      await initShieldedReceiverWallet(mnemonic);
    }
  });
};

const initShieldedReceiverWallet = async (mnemonic: string) => {
  const lepton = getLepton();
  const walletID = await lepton.createWalletFromMnemonic(
    configDefaults.leptonDbEncryptionKey,
    mnemonic,
  );
  shieldedReceiverWallet = lepton.wallets[walletID];
};

export const getRotatingRailgunAddress = (chainID?: NetworkChainID) => {
  if (!shieldedReceiverWallet) {
    throw new Error(
      'No receiver wallet configured. Please add `isShieldedReceiver` boolean value to one of your wallets.',
    );
  }
  const change = false;
  return shieldedReceiverWallet.getAddress(
    railgunAddressIndex++ % 5, // Rotate 0 -> 4
    change,
    chainID,
  );
};

export const validateRailgunWalletAddress_TODO = (
  address: string,
  chainID?: number,
) => {
  let decodedPublicKey;
  try {
    decodedPublicKey = decode(address).publicKey;
  } catch (err: any) {
    return false;
  }

  // TODO: Rotating index makes this broken.
  const index = 0;
  const change = false;
  const keypair = shieldedReceiverWallet.getKeypair(
    configDefaults.leptonDbEncryptionKey,
    index,
    change,
    chainID,
  );
  return decodedPublicKey === keypair.publicKey;
};

export const walletForIndex = (index: number, provider: BaseProvider) => {
  return new Wallet(activeWallets[index].privateKey, provider);
};

export const getAnyWalletForNetwork = (chainID: NetworkChainID) => {
  if (activeWallets.length < 1) {
    throw new Error('No wallets initialized.');
  }
  const provider = getProviderForNetwork(chainID);
  return walletForIndex(0, provider);
};
