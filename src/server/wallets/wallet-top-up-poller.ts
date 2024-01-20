import { logger } from '../../util/logger';
import { delay } from '../../util/promise-utils';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import { topUpWallet } from '../transactions/top-up-wallet';
import { isWalletUnavailable } from './available-wallets';
import { getActiveWallets, getActiveWalletsForChain } from './active-wallets';
import { ActiveWallet } from '../../models/wallet-models';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { RelayerChain } from '../../models/chain-models';
import { removeUndefineds } from '../../util/utils';
import debug from 'debug';
import { getActiveWalletGasTokenBalanceMapForChain } from '../balances/balance-cache';
import { TXIDVersion, isDefined } from '@railgun-community/shared-models';

const dbg = debug('relayer:top-up-poller');

// eslint-disable-next-line import/no-mutable-exports
export let shouldPollTopUp = true;

const pollTopUp = async () => {
  let walletFound = false;

  try {
    const { topUpChains } = configDefaults.topUps;
    const chains = configuredNetworkChains().filter((c) =>
      topUpChains.includes(c.id),
    );

    logger.warn(`Starting top up on ${chains.length} Chains.`);

    for (const chain of chains) {
      // eslint-disable-next-line no-await-in-loop
      const walletToTopUp = await getTopUpWallet(chain);
      if (isDefined(walletToTopUp)) {
        walletFound = true;
        logger.warn(
          `We have a wallet to top up | address: ${walletToTopUp.address} on chain:${chain.id}`,
        );
        const currentTXIDVersion = TXIDVersion.V2_PoseidonMerkle; // Switch this to V3 when balances migrated after release.
        // eslint-disable-next-line no-await-in-loop
        await topUpWallet(walletToTopUp, currentTXIDVersion, chain).catch((err) => {
          logger.warn(
            `Failed to top up wallet ${walletToTopUp.address} chain:${chain.id}, txidVersion:${currentTXIDVersion}`,
          );
          if (err.message.indexOf('Top Up too costly, skipping!') === -1) {
            logger.error(err);
          }
        });
      }
    }
  } catch (err) {
    logger.warn('top up error');
    logger.error(err);
  } finally {
    // select delay based on if we found a wallet to top up or not.
    const { refreshDelayInMS, foundRefreshDelayInMS } = configDefaults.topUps;
    const currentDelay = walletFound ? foundRefreshDelayInMS : refreshDelayInMS;
    if (walletFound) {
      logger.warn('Speed up the mojo-jojo!');
    } else {
      logger.warn('Ohhh that slooow burn.');
    }
    await delay(currentDelay);
    if (shouldPollTopUp) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      pollTopUp();
    }
  }
};

export const stopTopUpPolling = () => {
  shouldPollTopUp = false;
};

export const initTopUpPoller = async () => {
  if (!configDefaults.topUps.shouldTopUp) {
    return;
  }
  if (getActiveWallets().length < 2) {
    dbg('must have at least two active wallets to enable top up functionality');
    stopTopUpPolling();
    return;
  }
  // prevent this from starting for 10 mins
  await delay(10 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  pollTopUp();
};

export const getTopUpWallet = async (
  chain: RelayerChain,
): Promise<Optional<ActiveWallet>> => {
  const activeWallets = getActiveWalletsForChain(chain);

  const gasTokenBalanceMap = await getActiveWalletGasTokenBalanceMapForChain(
    chain,
    activeWallets,
  );

  // asending sort
  const topUpWallets: Optional<ActiveWallet>[] = activeWallets
    .filter((wallet) => {
      const { minimumGasBalanceForTopup } =
        configNetworks[chain.type][chain.id].topUp;

      const thresholdMet =
        gasTokenBalanceMap[wallet.address] < minimumGasBalanceForTopup;

      if (thresholdMet) {
        logger.warn(
          `Wallet ${wallet.address} on chain ${chain.type}:${chain.id} is below the threshold. Topping Up!`,
        );
      }

      return thresholdMet && !isWalletUnavailable(wallet, chain);
    })
    .sort((a, b) => {
      if (gasTokenBalanceMap[a.address] > gasTokenBalanceMap[b.address])
        return 1;
      if (gasTokenBalanceMap[a.address] < gasTokenBalanceMap[b.address])
        return -1;
      return 0;
    });

  if (removeUndefineds(topUpWallets).length === 0) {
    return undefined;
  }
  return topUpWallets[0];
};
