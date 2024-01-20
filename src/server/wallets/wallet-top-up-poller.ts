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
import { isDefined, TXIDVersion } from '@railgun-community/shared-models';
import { getPublicERC20AmountsBeforeUnwrap } from '../balances/top-up-balance';
import { lookUpCachedTokenPrice } from '../tokens/token-price-cache';
import { tokenForAddress } from '../tokens/network-tokens';
import { formatUnits, parseUnits } from 'ethers';

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
          `We have a wallet to top up! ${walletToTopUp.address} chain:${chain.id}`,
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
  await delay(2 * 60 * 1000);

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
  for (const activeWallet of activeWallets) {
    // eslint-disable-next-line no-await-in-loop
    const unwrappedTokensWaiting = await getPublicERC20AmountsBeforeUnwrap(
      activeWallet,
      chain,
      true, // force scan here to prevent unecessary additional unshielding.
    );
    if (unwrappedTokensWaiting.length > 0) {
      let totalTokenValue = 0;
      let tokenAmountValueThreshold: Optional<number>;
      for (const unshieldToken of unwrappedTokensWaiting) {
        const tokenPrice = lookUpCachedTokenPrice(chain, unshieldToken.tokenAddress);
        const token = tokenForAddress(chain, unshieldToken.tokenAddress);
        const tokenAmountReadable = formatUnits(unshieldToken.amount, token.decimals);
        const tokenAmountValue = parseFloat(tokenAmountReadable) * tokenPrice;
        totalTokenValue += tokenAmountValue;
        if (!isDefined(tokenAmountValueThreshold)) {
          const { gasToken } = configNetworks[chain.type][chain.id];
          const gasTokenPrice = lookUpCachedTokenPrice(chain, gasToken.wrappedAddress);
          const { swapThresholdIntoGasToken } = configNetworks[chain.type][chain.id].topUp;
          const gasTokenAmountReadable = formatUnits(swapThresholdIntoGasToken, gasToken.decimals);
          const swapThresholdIntoGasTokenValue = parseFloat(gasTokenAmountReadable) * gasTokenPrice;
          tokenAmountValueThreshold = swapThresholdIntoGasTokenValue / 3;
        }

        logger.warn(`Token ${unshieldToken.tokenAddress} on ${activeWallet.address} on chain ${chain.type}:${chain.id}.`)
        logger.warn(`Token Price: ${tokenPrice}`);
        logger.warn(`Token Amount Readable: ${tokenAmountReadable}`);
        logger.warn(`Token Amount Value: ${tokenAmountValue}`);
        logger.warn(`Token Value Threshold: ${tokenAmountValueThreshold}`);
      }
      if (isDefined(tokenAmountValueThreshold)) {
        if (totalTokenValue > tokenAmountValueThreshold) {
          logger.warn(`Tokens awaiting ${unwrappedTokensWaiting.length} | ${activeWallet.address} on chain ${chain.type}:${chain.id}.`);
          return activeWallet
        }
      }
    }
    logger.warn(`We have ${unwrappedTokensWaiting.length} tokens awaiting on ${activeWallet.address} on chain ${chain.type}:${chain.id}.`)
  }
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
