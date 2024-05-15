import { ERC20Amount } from '../../models/token-models';
import { ActiveWallet } from '../../models/wallet-models';
import { getERC20TokenBalance } from './erc20-token-balance';
import { networkTokens } from '../tokens/network-tokens';
import { removeUndefineds } from '../../util/utils';
import { BroadcasterChain } from '../../models/chain-models';
import configNetworks from '../config/config-networks';
import { delay } from '../../util/promise-utils';

import {
  cachePublicBalance,
  getCachedPublicBalance,
} from './public-balance-cache';
import debug from 'debug';

const dbg = debug('balance-getter');

export const getWrappedNativeTokenAddressForChain = (
  chain: BroadcasterChain,
): string => {
  return configNetworks[chain.type][chain.id].gasToken.wrappedAddress;
};

const getPublicBalances = async (
  wallet: ActiveWallet,
  chain: BroadcasterChain,
  tokenAddresses: string[],
  forceScan = false,
) => {
  const newPublicTokenAmounts: ERC20Amount[] = [];

  for (const tokenAddress of tokenAddresses) {
    // pull cached balances, this should get cleared once we get to 'unshield' section.
    let amount = 0n;
    if (forceScan) {
      dbg('forcing balance get');
      // eslint-disable-next-line no-await-in-loop
      amount = await getERC20TokenBalance(chain, wallet.address, tokenAddress);
    } else {
      amount =
        getCachedPublicBalance(chain, wallet.address, tokenAddress) ??
        // eslint-disable-next-line no-await-in-loop
        (await getERC20TokenBalance(chain, wallet.address, tokenAddress));
    }
    // eslint-disable-next-line no-await-in-loop
    await delay(500);
    if (amount > 0n) {
      const tokenAmount: ERC20Amount = {
        tokenAddress,
        amount,
      };
      newPublicTokenAmounts.push(tokenAmount);
    }
    cachePublicBalance(chain, wallet.address, tokenAddress, amount);
  }
  return removeUndefineds(newPublicTokenAmounts);
};

export const getPublicERC20AmountsBeforeUnwrap = async (
  wallet: ActiveWallet,
  chain: BroadcasterChain,
  forceScan = false,
): Promise<ERC20Amount[]> => {
  const tokensForChain = networkTokens[chain.type][chain.id];
  const tokenAddresses = tokensForChain.map((token) => token.address);
  const newPublicTokenAmounts: ERC20Amount[] = await getPublicBalances(
    wallet,
    chain,
    tokenAddresses,
    forceScan,
  );
  return newPublicTokenAmounts;
};
export const getPublicERC20AmountsAfterUnwrap = async (
  wallet: ActiveWallet,
  chain: BroadcasterChain,
  tokens: ERC20Amount[],
): Promise<ERC20Amount[]> => {
  const tokenAddresses = tokens.map((token) => token.tokenAddress);
  const newPublicTokenAmounts: ERC20Amount[] = await getPublicBalances(
    wallet,
    chain,
    tokenAddresses,
    true,
  );
  return newPublicTokenAmounts;
};
