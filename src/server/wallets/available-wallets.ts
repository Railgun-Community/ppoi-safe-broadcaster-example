import debug from 'debug';
import { ActiveWallet } from '../../models/wallet-models';
import { resetMapObject } from '../../util/utils';

const unavailableWalletMap: MapType<boolean> = {};

const dbg = debug('relayer:wallets');

export const setWalletAvailable = (
  wallet: ActiveWallet,
  available: boolean,
) => {
  unavailableWalletMap[wallet.address] = !available;
  dbg(`Update wallet ${wallet.address} availability:`, available);
};

export const isWalletAvailable = (wallet: ActiveWallet) => {
  return !unavailableWalletMap[wallet.address];
};

export const resetAvailableWallets = () => {
  resetMapObject(unavailableWalletMap);
};
