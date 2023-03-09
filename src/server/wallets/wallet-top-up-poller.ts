import { logger } from '../../util/logger';
import { delay } from '../../util/promise-utils';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { topUpWallet } from '../transactions/top-up-wallet';
import { shouldTopUpWallet } from './available-wallets';
import { getActiveWallets } from './active-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import configDefaults from '../config/config-defaults';
import { RelayerChain } from '../../models/chain-models';
import { removeUndefineds } from '../../util/utils';
import debug from 'debug';

const dbg = debug('relayer:top-up-poller');

// eslint-disable-next-line import/no-mutable-exports
export let shouldPollTopUp = true;

const pollTopUp = async () => {
  try {
    const chainIDs = configuredNetworkChains();
    await Promise.all(
      chainIDs.map(async (chainID) => {
        const walletToTopUp = await getTopUpWallet(chainID);
        if (walletToTopUp) {
          await topUpWallet(walletToTopUp, chainID);
        }
      }),
    );
  } catch (err) {
    logger.warn('top up error');
    logger.error(err);
  } finally {
    await delay(configDefaults.topUps.refreshDelayInMS);
    if (shouldPollTopUp) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      pollTopUp();
    }
  }
};

export const stopTopUpPolling = () => {
  shouldPollTopUp = false;
};

export const initTopUpPoller = () => {
  if (!configDefaults.topUps.shouldTopUp) {
    return;
  }
  if (getActiveWallets().length < 2) {
    dbg('must have at least two active wallets to enable top up functionality');
    stopTopUpPolling();
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  pollTopUp();
};

export const getTopUpWallet = async (
  chain: RelayerChain,
): Promise<Optional<ActiveWallet>> => {
  const activeWallets = getActiveWallets();

  const topUpWallets: Optional<ActiveWallet>[] = await Promise.all(
    activeWallets.map(async (activeWallet) => {
      const needsTopUp = await shouldTopUpWallet(activeWallet, chain);
      if (needsTopUp) {
        return activeWallet;
      }
      return undefined;
    }),
  );
  if (removeUndefineds(topUpWallets).length === 0) {
    return undefined;
  }
  return topUpWallets[0];
};
