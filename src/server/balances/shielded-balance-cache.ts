import {
  LeptonEvent,
  ScannedEventData,
} from '@railgun-community/lepton/dist/models/event-types';
import { bytes } from '@railgun-community/lepton/dist/utils';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { NetworkChainID } from '../config/config-chain-ids';
import { resetMapObject } from '../../util/utils';
import { TokenAmount } from '../../models/token-models';
import { BigNumber } from 'ethers';
import { throwErr } from '../../util/promise-utils';
import debug from 'debug';

const dbg = debug('relayer:shielded-cache');

export type ShieldedCachedBalance = {
  tokenAmount: TokenAmount;
  updatedAt: number;
};
// {chainID: {token: balance}[]}
const shieldedTokenBalanceCache: NumMapType<ShieldedCachedBalance[]> = {};

export const resetShieldedTokenBalanceCache = () => {
  resetMapObject(shieldedTokenBalanceCache);
};

export const subscribeToShieldedBalanceEvents = (wallet: RailgunWallet) => {
  wallet.on(LeptonEvent.WalletScanComplete, ({ chainID }: ScannedEventData) =>
    updateCachedShieldedBalances(wallet, chainID),
  );
};

export const parseRailBalanceAddress = (tokenAddress: string): string => {
  return `0x${bytes.trim(tokenAddress, 20)}`;
};

export const updateCachedShieldedBalances = async (
  wallet: RailgunWallet,
  chainID: NetworkChainID,
): Promise<void> => {
  if (shieldedTokenBalanceCache[chainID] === undefined) {
    shieldedTokenBalanceCache[chainID] = [];
  }
  dbg(`Wallet balance scanned. Getting balances for chain ${chainID}.`);
  const balances = await wallet.balances(chainID).catch(throwErr);
  const tokenAddresses = Object.keys(balances);
  tokenAddresses.forEach((railBalanceAddress) => {
    const parsedAddress =
      parseRailBalanceAddress(railBalanceAddress).toLowerCase();
    const tokenAmount: TokenAmount = {
      tokenAddress: parsedAddress,
      amount: BigNumber.from(balances[railBalanceAddress].balance.toString()),
    };
    shieldedTokenBalanceCache[chainID].push({
      tokenAmount,
      updatedAt: Date.now(),
    });
  });
};

export const getPrivateTokenBalanceCache = (
  chainID: NetworkChainID,
): ShieldedCachedBalance[] => {
  return shieldedTokenBalanceCache[chainID];
};
