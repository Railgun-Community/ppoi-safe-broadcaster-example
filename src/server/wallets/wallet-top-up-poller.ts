import { logger } from '../../util/logger';
import { delay } from '../../util/promise-utils';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { topUpWallet } from '../transactions/top-up-wallet';
import configWalletTopUpRefresher from '../config/config-wallet-top-up-refresher';
import { shouldTopUpWallet } from './available-wallets';
import { getActiveWallets } from './active-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import configDefaults from '../config/config-defaults';
import { RelayerChain } from '../../models/chain-models';
import { removeUndefineds } from '../../util/utils';

let shouldPoll = true;

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
  } catch (err: any) {
    logger.warn('top up error');
    logger.error(err);
  } finally {
    await delay(configWalletTopUpRefresher.refreshDelayInMS);
    if (shouldPoll) {
      pollTopUp();
    }
  }
};

export const stopTopUpPolling = () => {
  shouldPoll = false;
};

export const initTopUpPoller = () => {
  if (!configDefaults.topUps.shouldTopUp) {
    return;
  }
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
