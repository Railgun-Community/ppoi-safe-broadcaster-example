import { BaseProvider } from '@ethersproject/providers';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { Wallet as EthersWallet } from 'ethers';
import { isValidMnemonic } from 'ethers/lib/utils';
import { NetworkChainID } from '../config/config-chain-ids';
import configDefaults from '../config/config-defaults';
import { ActiveWallet } from '../../models/wallet-models';
import { resetArray } from '../../util/utils';
import { getLepton } from '../lepton/lepton-init';

const activeWallets: ActiveWallet[] = [];

let railgunWallet: RailgunWallet;

const RAILGUN_ADDRESS_INDEX = 0;

export const resetWallets = () => {
  resetArray(activeWallets);
};

export const derivationPathForIndex = (index: number) => {
  return `m/44'/60'/0'/0/${index}`;
};

const initRailgunWallet = async (mnemonic: string) => {
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
  railgunWallet = lepton.wallets[walletID];
};

export const initWallets = async () => {
  resetWallets();
  const { mnemonic, hdWallets } = configDefaults.wallet;
  hdWallets.forEach(({ index, priority }) => {
    if (!isValidMnemonic(mnemonic)) {
      throw Error(
        'Invalid or missing MNEMONIC (use docker secret or insecure env-cmdrc for testing)',
      );
    }
    const wallet = EthersWallet.fromMnemonic(
      mnemonic,
      derivationPathForIndex(index),
    );
    activeWallets.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic,
      priority,
      index,
    });
  });
  await initRailgunWallet(mnemonic);
};

export const getRailgunWallet = (): RailgunWallet => {
  if (!railgunWallet) {
    throw new Error('No Railgun wallet initialized.');
  }
  return railgunWallet;
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
  return getRailgunWallet().getKeypair(
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
  return getRailgunWallet().getAddress(RAILGUN_ADDRESS_INDEX, change, chainID);
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
