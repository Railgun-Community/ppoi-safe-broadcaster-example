import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import configDefaults from '../config/config-defaults';
import { resetMapObject } from '../../util/utils';
import { ActiveWallet } from '../../models/wallet-models';
import { logger } from '../../util/logger';
import { RelayerChain } from '../../models/chain-models';
import { getPaymasterGasBalance } from './paymaster-gas-balance';

type CachedBalance = {
  balance: BigNumber;
  updatedAt: number;
};

// {chainType: {chainID: {Address: Balance}}}
const paymasterGasBalanceCache: NumMapType<NumMapType<MapType<CachedBalance>>> =
  {};

export const resetPaymasterGasBalanceCache = () => {
  resetMapObject(paymasterGasBalanceCache);
};

export const updateCachedPaymasterGasBalance = async (
  chain: RelayerChain,
  walletAddress: string,
): Promise<void> => {
  const balance = await getPaymasterGasBalance(chain, walletAddress);
  if (balance == null) {
    return;
  }
  paymasterGasBalanceCache[chain.type] ??= {};
  paymasterGasBalanceCache[chain.type][chain.id] ??= {};
  paymasterGasBalanceCache[chain.type][chain.id][walletAddress] = {
    balance,
    updatedAt: Date.now(),
  };
};

export const shouldUpdateCachedPaymasterGasBalance = (
  chain: RelayerChain,
  walletAddress: string,
) => {
  paymasterGasBalanceCache[chain.type] ??= {};
  paymasterGasBalanceCache[chain.type][chain.id] ??= {};
  if (paymasterGasBalanceCache[chain.type][chain.id][walletAddress] == null) {
    return true;
  }
  const cachedBalance =
    paymasterGasBalanceCache[chain.type][chain.id][walletAddress];
  const cachedBalanceExpired =
    cachedBalance.updatedAt <
    Date.now() - configDefaults.paymaster.gasBalanceCacheTTLInMS;
  return cachedBalanceExpired;
};

export const getCachedPaymasterGasBalance = async (
  chain: RelayerChain,
  walletAddress: string,
): Promise<BigNumber> => {
  if (shouldUpdateCachedPaymasterGasBalance(chain, walletAddress)) {
    await updateCachedPaymasterGasBalance(chain, walletAddress);
  }
  paymasterGasBalanceCache[chain.type] ??= {};
  paymasterGasBalanceCache[chain.type][chain.id] ??= {};
  if (paymasterGasBalanceCache[chain.type][chain.id][walletAddress] == null) {
    throw new Error('No paymaster balance found');
  }
  return paymasterGasBalanceCache[chain.type][chain.id][walletAddress].balance;
};

export const getActiveWalletPaymasterGasBalanceMapForChain = async (
  chain: RelayerChain,
  activeWallets: ActiveWallet[],
): Promise<MapType<BigNumber>> => {
  const getBalancePromises: Promise<Optional<BigNumber>>[] = [];
  activeWallets.forEach(({ address }) => {
    getBalancePromises.push(
      getCachedPaymasterGasBalance(chain, address).catch((err) => {
        logger.error(err);
        return undefined;
      }),
    );
  });
  const balances = await Promise.all(getBalancePromises);

  const balanceMap: MapType<BigNumber> = {};
  activeWallets.forEach((activeWallet, index) => {
    const balance = balances[index];
    if (balance != null) {
      balanceMap[activeWallet.address] = balance;
    }
  });

  return balanceMap;
};

export const convertToReadableGasTokenBalanceMap = (
  gasTokenBalanceMap: MapType<BigNumber>,
) => {
  const addresses = Object.keys(gasTokenBalanceMap);
  const readableMap: MapType<string> = {};
  const decimals = 18;
  addresses.forEach((address) => {
    readableMap[address] = formatUnits(gasTokenBalanceMap[address], decimals);
  });
  return readableMap;
};
