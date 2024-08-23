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
import { BroadcasterChain } from '../../models/chain-models';
import {
  createRailgunWallet,
  generatePOIsForWallet,
  isBlockedAddress,
  refreshBalances,
  refreshReceivePOIsForWallet,
  rescanFullUTXOMerkletreesAndWallets,
  resetFullTXIDMerkletreesV2,
  walletForID,
} from '@railgun-community/wallet';
import {
  isDefined,
  NETWORK_CONFIG,
  networkForChain,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { delay } from '../../util/promise-utils';
import { getSettingsNumber, storeSettingsNumber } from '../db/settings-db';
import { getReliabilityKeyPath } from '../../util/reliability';

const activeWallets: ActiveWallet[] = [];

let railgunWalletAddress: string;
let railgunWalletID: string;

const dbg = debug('broadcaster:wallets');

export const resetWallets = () => {
  resetArray(activeWallets);
};

export const derivationPathForIndex = (index: number) => {
  return `m/44'/60'/0'/0/${index}`;
};

const initRailgunWallet = async (
  mnemonic: string,
  railgunWalletDerivationIndex = 0,
) => {
  const encryptionKey = configDefaults.engine.dbEncryptionKey;
  if (!isDefined(encryptionKey) || encryptionKey === '') {
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
    railgunWalletDerivationIndex,
  );
  railgunWalletAddress = railgunWalletInfo.railgunAddress;
  railgunWalletID = railgunWalletInfo.id;
};

export const initWallets = async (railgunWalletDerivationIndex = 0) => {
  resetWallets();
  const { mnemonic, hdWallets } = configDefaults.wallet;
  hdWallets.forEach(({ index, priority, chains }) => {
    const wallet = HDNodeWallet.fromMnemonic(
      Mnemonic.fromPhrase(mnemonic),
      derivationPathForIndex(index),
    );
    if (isBlockedAddress(wallet.address)) return;
    activeWallets.push({
      address: wallet.address,
      pkey: wallet.privateKey,
      priority,
      index,
      chains,
    });
  });
  await initRailgunWallet(mnemonic, railgunWalletDerivationIndex);
  printDebugWalletData();
};

export const fullUTXOResyncBroadcasterWallets = async () => {
  const chains = configuredNetworkChains();
  for (const chain of chains) {
    const network = networkForChain(chain);
    if (!isDefined(network)) {
      continue;
    }
    const key = `lastFullSyncTimestamp|${chain.type}|${chain.id}`;
    const lastFULLSYNCtimestamp =
      // eslint-disable-next-line no-await-in-loop
      (await getSettingsNumber(key).catch((e) => {
        dbg(`Error getting SyncTimestamp, ${key}: ${e}`);
      })) ?? 0;
    const shouldRESYNC =
      !isDefined(lastFULLSYNCtimestamp) ||
      lastFULLSYNCtimestamp < configDefaults.lastFullSyncTimestamp;
    dbg(
      `LASTFULLSYNC", ${lastFULLSYNCtimestamp}, ${configDefaults.lastFullSyncTimestamp}`,
    );
    if (shouldRESYNC) {
      dbg(`Starting Full Rescan of ${chain.type}:${chain.id}`);
      // eslint-disable-next-line no-await-in-loop
      await refreshBalances(chain, [railgunWalletID]);
      dbg(`Finished Balance Rescan of chain ${chain.type}:${chain.id}`);

      dbg(`Now Starting Full UTXO Rescan on chain ${chain.type}:${chain.id}`);
      // eslint-disable-next-line no-await-in-loop
      await rescanFullUTXOMerkletreesAndWallets(chain, [railgunWalletID]);
      dbg(`Finished Full UTXO Rescan on chain ${chain.type}:${chain.id}`);

      dbg(`Starting Generation of PPOI for chain ${chain.type}:${chain.id}`);
      // eslint-disable-next-line no-await-in-loop
      await generatePOIsForWallet(network.name, railgunWalletID);
      dbg(`Finished Generation of PPOI for chain ${chain.type}:${chain.id}`);

      const newTimestamp = Date.now();
      // eslint-disable-next-line no-await-in-loop
      await storeSettingsNumber(key, newTimestamp).catch((e) => {
        dbg(`Error setting SyncTimestamp, ${key}: ${newTimestamp}: ${e}`);
      });
    }
  }
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
  chain: BroadcasterChain,
): ActiveWallet[] => {
  return getActiveWallets().filter(
    (wallet) => !wallet.chains || wallet.chains.includes(chain.id),
  );
};

export const numAvailableWallets = async (
  chain: BroadcasterChain,
): Promise<number> => {
  // const walletPromises: Promise<boolean>[] = [];
  const walletsAvailability: boolean[] = [];
  for (const wallet of getActiveWallets()) {
    // eslint-disable-next-line no-await-in-loop
    const available = await isWalletAvailableWithEnoughFunds(wallet, chain);
    walletsAvailability.push(available);
    // eslint-disable-next-line no-await-in-loop
    await delay(250);
  }

  // const walletAvailability = await Promise.all(walletPromises);

  return walletsAvailability.filter((available) => available).length;
};
