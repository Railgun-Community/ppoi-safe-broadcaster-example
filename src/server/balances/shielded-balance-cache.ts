import {
  LeptonEvent,
  ScannedEventData,
} from '@railgun-community/lepton/dist/models/event-types';
import { bytes } from '@railgun-community/lepton/dist/utils';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet/wallet';
import { resetMapObject } from '../../util/utils';
import { TokenAmount } from '../../models/token-models';
import { BigNumber } from 'ethers';
import { throwErr } from '../../util/promise-utils';
import { RelayerChain } from '../../models/chain-models';
import debug from 'debug';

const dbg = debug('relayer:shielded-cache');

export type ShieldedCachedBalance = {
  tokenAmount: TokenAmount;
  updatedAt: number;
};
// {chainType: {chainID: {token: balance}[]}}
const shieldedTokenBalanceCache: NumMapType<
  NumMapType<ShieldedCachedBalance[]>
> = {};

export const resetShieldedTokenBalanceCache = () => {
  resetMapObject(shieldedTokenBalanceCache);
};

export const subscribeToShieldedBalanceEvents = (wallet: RailgunWallet) => {
  wallet.on(LeptonEvent.WalletScanComplete, ({ chain }: ScannedEventData) =>
    updateCachedShieldedBalances(wallet, chain),
  );
};

export const parseRailBalanceAddress = (tokenAddress: string): string => {
  return `0x${bytes.trim(tokenAddress, 20)}`;
};

export const updateCachedShieldedBalances = async (
  wallet: RailgunWallet,
  chain: RelayerChain,
): Promise<void> => {
  shieldedTokenBalanceCache[chain.type] ??= {};
  shieldedTokenBalanceCache[chain.type][chain.id] ??= [];
  dbg(`Wallet balance scanned. Getting balances for chain ${chain.id}.`);
  const balances = await wallet.balances(chain).catch(throwErr);
  const tokenAddresses = Object.keys(balances);
  tokenAddresses.forEach((railBalanceAddress) => {
    const parsedAddress =
      parseRailBalanceAddress(railBalanceAddress).toLowerCase();
    const tokenAmount: TokenAmount = {
      tokenAddress: parsedAddress,
      amount: BigNumber.from(balances[railBalanceAddress].balance.toString()),
    };
    shieldedTokenBalanceCache[chain.type][chain.id].push({
      tokenAmount,
      updatedAt: Date.now(),
    });
  });
};

export const getPrivateTokenBalanceCache = (
  chain: RelayerChain,
): ShieldedCachedBalance[] => {
  shieldedTokenBalanceCache[chain.type] ??= {};
  shieldedTokenBalanceCache[chain.type][chain.id] ??= [];
  return shieldedTokenBalanceCache[chain.type][chain.id];
};
