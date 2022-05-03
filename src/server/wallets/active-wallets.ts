import { BaseProvider } from '@ethersproject/providers';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { Wallet as EthersWallet } from 'ethers';
import { isValidMnemonic } from 'ethers/lib/utils';
import {
  AddressData,
  decode,
} from '@railgun-community/lepton/dist/keyderivation/bech32-encode';
import debug from 'debug';
import { NetworkChainID } from '../config/config-chain-ids';
import configDefaults from '../config/config-defaults';
import { ActiveWallet } from '../../models/wallet-models';
import { resetArray } from '../../util/utils';
import { getLepton } from '../lepton/lepton-init';
import { isWalletAvailable } from './available-wallets';
import {
  convertToReadableGasTokenBalanceMap,
  getActiveWalletGasTokenBalanceMapForChain,
} from '../balances/balance-cache';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import configNetworks from '../config/config-networks';

const activeWallets: ActiveWallet[] = [];

let railgunWallet: RailgunWallet;
let railgunWalletAnyAddress: string;

const dbg = debug('relayer:wallets');

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
  const anyChainID = 0;
  railgunWalletAnyAddress = railgunWallet.getAddress(anyChainID);
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
    // TODO: determine whether wallet is currently busy, set available(false) if so.
    activeWallets.push({
      address: wallet.address,
      pkey: wallet.privateKey,
      priority,
      index,
    });
  });
  await initRailgunWallet(mnemonic);
  printDebugWalletData();
};

const printDebugWalletData = () => {
  dbg(
    'Loaded public wallets:',
    activeWallets.map((w) => w.address),
  );
  dbg('Loaded private wallet:', railgunWalletAnyAddress);

  configuredNetworkChainIDs().forEach(async (chainID) => {
    const gasTokenBalanceMap = await getActiveWalletGasTokenBalanceMapForChain(
      chainID,
      activeWallets,
    );
    const gasToken = configNetworks[chainID].gasToken.symbol;
    const gasTokenBalanceMapReadable =
      convertToReadableGasTokenBalanceMap(gasTokenBalanceMap);
    dbg(`Chain ${chainID}, ${gasToken} balances:`, gasTokenBalanceMapReadable);
  });
};

export const getRailgunWallet = (): RailgunWallet => {
  if (!railgunWallet) {
    throw new Error('No Railgun wallet initialized.');
  }
  return railgunWallet;
};

export const getRailgunAnyAddress = (chainID: NetworkChainID = 0) => {
  return railgunWalletAnyAddress;
};

export const getRailgunAddressData = (): AddressData => {
  return decode(getRailgunAnyAddress());
};

export const getRailgunPrivateViewingKey = () => {
  return getRailgunWallet().getViewingKeyPair().privateKey;
};

export const createEthersWallet = (
  activeWallet: ActiveWallet,
  provider: BaseProvider,
): EthersWallet => {
  return new EthersWallet(activeWallet.pkey, provider);
};

export const getActiveWallets = (): ActiveWallet[] => {
  if (activeWallets.length < 1) {
    throw new Error('No wallets initialized.');
  }
  return activeWallets;
};

export const numAvailableWallets = async (
  chainID: NetworkChainID,
): Promise<number> => {
  const walletAvailability = await Promise.all(
    getActiveWallets().map((wallet) => isWalletAvailable(wallet, chainID)),
  );
  return walletAvailability.filter((available) => available).length;
};
