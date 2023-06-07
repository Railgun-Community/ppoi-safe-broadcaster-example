import {
  Wallet as EthersWallet,
  HDNodeWallet,
  Mnemonic,
  Provider,
} from 'ethers';
import debug from 'debug';
import configDefaults from '../config/config-defaults';
import { ActiveWallet } from '../../models/wallet-models';
import { resetArray } from '../../util/utils';
import { isWalletAvailableWithEnoughFunds } from './available-wallets';
import {
  convertToReadableGasTokenBalanceMap,
  getActiveWalletGasTokenBalanceMapForChain,
} from '../balances/balance-cache';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import configNetworks from '../config/config-networks';
import { RelayerChain } from '../../models/chain-models';
import { createRailgunWallet } from '@railgun-community/wallet';

const activeWallets: ActiveWallet[] = [];

let railgunWalletAddress: string;
let railgunWalletID: string;

const dbg = debug('relayer:wallets');

export const resetWallets = () => {
  resetArray(activeWallets);
};

export const derivationPathForIndex = (index: number) => {
  return `m/44'/60'/0'/0/${index}`;
};

const initRailgunWallet = async (mnemonic: string) => {
  const encryptionKey = configDefaults.engine.dbEncryptionKey;
  if (!encryptionKey) {
    throw new Error(
      'DB_ENCRYPTION_KEY not set (use docker secret, or env-cmdrc for insecure testing)',
    );
  }

  // TODO: Add creationBlockNumbers for optimized balance scanning.
  const creationBlockNumbers: Optional<MapType<number>> = undefined;

  const railgunWalletInfo = await createRailgunWallet(
    encryptionKey,
    mnemonic,
    creationBlockNumbers,
  );
  railgunWalletAddress = railgunWalletInfo.railgunAddress;
  railgunWalletID = railgunWalletInfo.id;
};

export const initWallets = async () => {
  resetWallets();
  const { mnemonic, hdWallets } = configDefaults.wallet;
  hdWallets.forEach(({ index, priority, chains }) => {
    const wallet = HDNodeWallet.fromMnemonic(
      Mnemonic.fromPhrase(mnemonic),
      derivationPathForIndex(index),
    );
    // TODO: determine whether wallet is currently busy, set available(false) if so.
    activeWallets.push({
      address: wallet.address,
      pkey: wallet.privateKey,
      priority,
      index,
      chains,
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
  dbg('Loaded private wallet:', railgunWalletAddress);

  configuredNetworkChains().forEach(async (chain) => {
    const gasTokenBalanceMap = await getActiveWalletGasTokenBalanceMapForChain(
      chain,
      activeWallets,
    );
    const gasToken = configNetworks[chain.type][chain.id].gasToken.symbol;
    const gasTokenBalanceMapReadable =
      convertToReadableGasTokenBalanceMap(gasTokenBalanceMap);
    dbg(
      `Chain ${chain.type}:${chain.id}, ${gasToken} balances:`,
      gasTokenBalanceMapReadable,
    );
  });
};

export const getRailgunWalletID = (): string => {
  if (!railgunWalletID) {
    throw new Error('No Railgun wallet initialized.');
  }
  return railgunWalletID;
};

export const getRailgunWalletAddress = (): string => {
  if (!railgunWalletAddress) {
    throw new Error('No Railgun wallet initialized.');
  }
  return railgunWalletAddress;
};

export const createEthersWallet = (
  activeWallet: ActiveWallet,
  provider: Provider,
): EthersWallet => {
  return new EthersWallet(activeWallet.pkey, provider);
};

export const getActiveWallets = (): ActiveWallet[] => {
  if (activeWallets.length < 1) {
    throw new Error('No wallets initialized.');
  }
  return activeWallets;
};

export const getActiveWalletsForChain = (
  chain: RelayerChain,
): ActiveWallet[] => {
  return getActiveWallets().filter(
    (wallet) => !wallet.chains || wallet.chains.includes(chain.id),
  );
};

export const numAvailableWallets = async (
  chain: RelayerChain,
): Promise<number> => {
  const walletAvailability = await Promise.all(
    getActiveWallets().map(
      async (wallet) => await isWalletAvailableWithEnoughFunds(wallet, chain),
    ),
  );
  return walletAvailability.filter((available) => available).length;
};
