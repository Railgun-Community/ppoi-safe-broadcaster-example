import { ActiveWallet } from '../../models/wallet-models';
import { resetMapObject } from '../../util/utils';

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

export const resetAvailableWallets = () => {
  resetMapObject(unavailableWalletMap);
};
