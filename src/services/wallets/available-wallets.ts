import { ActiveWallet } from '../../models/wallet-models';

const unavailableWalletMap: MapType<boolean> = {};

export const setWalletAvailable = (
  wallet: ActiveWallet,
  available: boolean,
) => {
  unavailableWalletMap[wallet.address] = !available;
};

export const isWalletAvailable = (wallet: ActiveWallet) => {
  return !unavailableWalletMap[wallet.address];
};
