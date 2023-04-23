import { BaseProvider } from '@ethersproject/providers';
import debug from 'debug';
import configDefaults from '../config/config-defaults';
import { ActiveWallet } from '../../models/wallet-models';
import { resetArray } from '../../util/utils';
import { isWalletAvailableWithEnoughFunds } from './available-wallets';
import {
  convertToReadableGasTokenBalanceMap,
  getActiveWalletGasTokenBalanceMapForChain,
} from '../balances/gas-balance-cache';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import configNetworks from '../config/config-networks';
import { RelayerChain } from '../../models/chain-models';
import { createRailgunWallet } from '@railgun-community/quickstart';
import { getActiveWalletPaymasterGasBalanceMapForChain } from '../balances/paymaster-gas-balance-cache';
import { PaymasterWallet } from './paymaster-wallet';
import { Wallet } from '@ethersproject/wallet';
import { isValidMnemonic } from '@ethersproject/hdnode';

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

  const railgunWalletResponse = await createRailgunWallet(
    encryptionKey,
    mnemonic,
    creationBlockNumbers,
  );
  if (railgunWalletResponse.error) {
    throw new Error(
      `Error creating RAILGUN wallet: ${railgunWalletResponse.error}`,
    );
  }
  if (!railgunWalletResponse.railgunWalletInfo) {
    throw new Error(`Error getting RAILGUN wallet info`);
  }

  railgunWalletAddress = railgunWalletResponse.railgunWalletInfo.railgunAddress;
  railgunWalletID = railgunWalletResponse.railgunWalletInfo.id;
};

export const initWallets = async () => {
  resetWallets();
  const { mnemonic, hdWallets } = configDefaults.wallet;
  let isFirstWallet = true;
  hdWallets.forEach(({ index, priority, chains }) => {
    if (!isValidMnemonic(mnemonic)) {
      throw Error(
        'Invalid or missing MNEMONIC (use docker secret or insecure env-cmdrc for testing)',
      );
    }
    const wallet = Wallet.fromMnemonic(mnemonic, derivationPathForIndex(index));
    // TODO: determine whether wallet is currently busy, set available(false) if so.
    activeWallets.push({
      address: wallet.address,
      pkey: wallet.privateKey,
      priority,
      index,
      chains,
    });

    if (isFirstWallet) {
      PaymasterWallet.setPaymasterWallet(wallet);
      isFirstWallet = false;
    }
  });
  await initRailgunWallet(mnemonic);
  printDebugWalletData();
};

const printDebugWalletData = () => {
  dbg(
    'Loaded public wallets:',
    activeWallets.map((w) => w.address),
  );
  dbg('Loaded RAILGUN wallet:', railgunWalletAddress);

  // Log Wallet balances
  configuredNetworkChains().forEach(async (chain) => {
    const gasTokenBalanceMap = await getActiveWalletGasTokenBalanceMapForChain(
      chain,
      activeWallets,
    );
    const gasToken = configNetworks[chain.type][chain.id].gasToken.symbol;
    const gasTokenBalanceMapReadable =
      convertToReadableGasTokenBalanceMap(gasTokenBalanceMap);
    dbg(
      `Chain ${chain.type}:${chain.id}, ${gasToken} WALLET balances:`,
      gasTokenBalanceMapReadable,
    );
  });

  // Log Paymaster balances
  configuredNetworkChains().forEach(async (chain) => {
    const paymasterGasBalanceMap =
      await getActiveWalletPaymasterGasBalanceMapForChain(chain, activeWallets);
    const gasToken = configNetworks[chain.type][chain.id].gasToken.symbol;
    const paymasterGasBalanceMapReadable = convertToReadableGasTokenBalanceMap(
      paymasterGasBalanceMap,
    );
    dbg(
      `Chain ${chain.type}:${chain.id}, ${gasToken} PAYMASTER balances:`,
      paymasterGasBalanceMapReadable,
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
  provider: BaseProvider,
): Wallet => {
  return new Wallet(activeWallet.pkey, provider);
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
