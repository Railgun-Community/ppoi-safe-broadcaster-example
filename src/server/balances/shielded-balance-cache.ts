import {
  BalancesUpdatedCallback,
  refreshBalances,
} from '@railgun-community/wallet';
import { resetMapObject } from '../../util/utils';
import { ERC20Amount } from '../../models/token-models';
import { BroadcasterChain } from '../../models/chain-models';
import {
  RailgunBalancesEvent,
  RailgunWalletBalanceBucket,
  TXIDVersion,
  isDefined,
} from '@railgun-community/shared-models';
import { getRailgunWalletID } from '../wallets/active-wallets';
import debug from 'debug';

const dbg = debug('broadcaster:balances:shielded');

export type ShieldedCachedBalance = {
  erc20Amount: ERC20Amount;
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
  txidVersion: TXIDVersion,
  chain: BroadcasterChain,
) => {
  balancePromiseResolve = undefined;

  const railgunWalletID = getRailgunWalletID();
  const balancePromise = new Promise<void>((resolve) => {
    balancePromiseResolve = resolve;
  });
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  refreshBalances(chain, [railgunWalletID]);
  return balancePromise;
};

// Called by RAILGUN Engine when balances updated.
export const onBalanceUpdateCallback: BalancesUpdatedCallback = ({
  chain,
  erc20Amounts,
  railgunWalletID: balanceRailgunWalletID,
  balanceBucket,
}: RailgunBalancesEvent) => {
  if (balanceBucket !== RailgunWalletBalanceBucket.Spendable) {
    return; // gate spendable balances.
  }
  const railgunWalletID = getRailgunWalletID();
  if (railgunWalletID !== balanceRailgunWalletID) {
    return;
  }

  shieldedTokenBalanceCache[chain.type] ??= {};
  shieldedTokenBalanceCache[chain.type][chain.id] ??= {};

  erc20Amounts.forEach((erc20Amount) => {
    shieldedTokenBalanceCache[chain.type][chain.id][erc20Amount.tokenAddress] =
      {
        erc20Amount,
        updatedAt: Date.now(),
      };
  });

  if (isDefined(balancePromiseResolve)) {
    balancePromiseResolve();
  }
  dbg(`Shielded balances updated for ${chain.type}:${chain.id}`);
};

export const getPrivateTokenBalanceCache = (
  chain: BroadcasterChain,
): ShieldedCachedBalance[] => {
  shieldedTokenBalanceCache[chain.type] ??= {};
  shieldedTokenBalanceCache[chain.type][chain.id] ??= {};
  return Object.values(shieldedTokenBalanceCache[chain.type][chain.id]).map(
    (o) => {
      return { erc20Amount: { ...o.erc20Amount }, updatedAt: o.updatedAt };
    },
  );
};
