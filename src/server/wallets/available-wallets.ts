import { parseUnits } from '@ethersproject/units';
import debug from 'debug';
import { ActiveWallet } from '../../models/wallet-models';
import { resetMapObject } from '../../util/utils';
import { getCachedGasTokenBalance } from '../balances/balance-cache';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';

const unavailableWalletMap: NumMapType<MapType<boolean>> = {};

const dbg = debug('relayer:wallets:availability');

export const setWalletAvailable = (
  wallet: ActiveWallet,
  chainID: NetworkChainID,
  available: boolean,
) => {
  unavailableWalletMap[chainID] = unavailableWalletMap[chainID] ?? {};
  unavailableWalletMap[chainID][wallet.address] = !available;
  dbg(`Set wallet ${wallet.address}:`, available ? 'AVAILABLE' : 'BUSY');
};

export const isWalletAvailable = async (
  wallet: ActiveWallet,
  chainID: NetworkChainID,
) => {
  if (
    unavailableWalletMap[chainID] &&
    unavailableWalletMap[chainID][wallet.address]
  ) {
    return false;
  }
  const { gasToken } = configNetworks[chainID];
  const minimumBalance = parseUnits(
    String(gasToken.minimumBalanceForAvailability),
    18,
  );
  const balance = await getCachedGasTokenBalance(chainID, wallet.address);
  if (balance.lt(minimumBalance)) {
    return false;
  }
  return true;
};

export const getAvailableWallets = async (
  activeWallets: ActiveWallet[],
  chainID: NetworkChainID,
) => {
  const walletAvailability = await Promise.all(
    activeWallets.map((wallet) => isWalletAvailable(wallet, chainID)),
  );
  return activeWallets.filter((_wallet, index) => walletAvailability[index]);
};

export const resetAvailableWallets = (chainID: NetworkChainID) => {
  resetMapObject(unavailableWalletMap[chainID]);
};
