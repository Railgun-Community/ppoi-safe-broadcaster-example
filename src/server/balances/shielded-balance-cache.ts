import {
  BalancesUpdatedCallback,
  refreshRailgunBalances,
} from '@railgun-community/quickstart';
import { resetMapObject } from '../../util/utils';
import { TokenAmount } from '../../models/token-models';
import { BigNumber } from 'ethers';
import { RelayerChain } from '../../models/chain-models';
import { RailgunBalancesEvent } from '@railgun-community/shared-models';
import { getRailgunWalletID } from '../wallets/active-wallets';

// const dbg = debug('relayer:balances:shielded');

export type ShieldedCachedBalance = {
  tokenAmount: TokenAmount;
  updatedAt: number;
};

// Type: {chainType: {chainID: {token: balance}[]}}
const shieldedTokenBalanceCache: NumMapType<
  NumMapType<MapType<ShieldedCachedBalance>>
> = {};

export const resetShieldedTokenBalanceCache = () => {
  resetMapObject(shieldedTokenBalanceCache);
};

let balancePromiseResolve: Optional<() => void>;

export const updateShieldedBalances = async (
  chain: RelayerChain,
  fullRescan: boolean,
) => {
  balancePromiseResolve = undefined;

  const railgunWalletID = getRailgunWalletID();
  const response = await refreshRailgunBalances(
    chain,
    railgunWalletID,
    fullRescan,
  );
  if (response.error) {
    throw new Error(`Could not update RAILGUN balances: ${response.error}`);
  }
  return new Promise<void>((resolve) => {
    balancePromiseResolve = resolve;
  });
};

// Called by RAILGUN Engine when balances updated.
export const onBalanceUpdateCallback: BalancesUpdatedCallback = ({
  chain,
  erc20Amounts,
  railgunWalletID: balanceRailgunWalletID,
}: RailgunBalancesEvent) => {
  const railgunWalletID = getRailgunWalletID();
  if (railgunWalletID !== balanceRailgunWalletID) {
    return;
  }

  shieldedTokenBalanceCache[chain.type] ??= {};
  shieldedTokenBalanceCache[chain.type][chain.id] ??= {};

  erc20Amounts.forEach(({ tokenAddress, amountString }) => {
    const tokenAmount: TokenAmount = {
      tokenAddress,
      amount: BigNumber.from(amountString),
    };
    shieldedTokenBalanceCache[chain.type][chain.id][tokenAddress] = {
      tokenAmount,
      updatedAt: Date.now(),
    };
  });

  if (balancePromiseResolve) {
    balancePromiseResolve();
  }
  // dbg(
  //   `Shielded balances updated for ${chain.type}:${chain.id}`,
  //   shieldedTokenBalanceCache[chain.type][chain.id],
  // );
};

export const getPrivateTokenBalanceCache = (
  chain: RelayerChain,
): ShieldedCachedBalance[] => {
  shieldedTokenBalanceCache[chain.type] ??= {};
  shieldedTokenBalanceCache[chain.type][chain.id] ??= {};
  return Object.values(shieldedTokenBalanceCache[chain.type][chain.id]);
};
