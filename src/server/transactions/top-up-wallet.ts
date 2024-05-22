import { ERC20Amount } from '../../models/token-models';
import { ActiveWallet } from '../../models/wallet-models';
import {
  createEthersWallet,
  getRailgunWalletID,
} from '../wallets/active-wallets';
import { setWalletAvailability } from '../wallets/available-wallets';
import { unshieldTokens } from './unshield-tokens';
import { getFirstJsonRpcProviderForNetwork } from '../providers/active-network-providers';
import {
  getCurrentWalletNonce,
  waitForTx,
  waitForTxs,
} from './execute-transaction';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import debug from 'debug';
import { swapZeroX } from './0x-swap';
import { BroadcasterChain } from '../../models/chain-models';
import { Wallet } from 'ethers';
import { nativeUnwrap } from './native-unwrap';
import { delay } from '../../util/promise-utils';
import { clearCachedTransaction } from '../fees/gas-price-cache';
import {
  getWrappedNativeTokenAddressForChain,
  getPublicERC20AmountsBeforeUnwrap,
  getPublicERC20AmountsAfterUnwrap,
} from '../balances/top-up-balance';
import { clearCachedBalances } from '../balances/public-balance-cache';
import {
  initTopUpTokenCache,
  cachedTopUpTokens,
  getMultiTopUpTokenAmountsForChain,
  getTopUpTokenAmountsForChain,
  clearCachedTokens,
} from './top-up-util';
import { NetworkChainID } from '../config/config-chains';
import { ChainType, TXIDVersion } from '@railgun-community/shared-models';
import { updateCachedGasTokenBalance } from '../balances/balance-cache';
import { swapUniswap } from './uniswap-swap';
import { approveZeroX } from './approve-spender';

const dbg = debug('broadcaster:topup-util');

const getTopUpTokens = async (
  txidVersion: TXIDVersion,
  chain: BroadcasterChain,
): Promise<ERC20Amount[]> => {
  initTopUpTokenCache(chain);
  if (typeof cachedTopUpTokens[chain.type][chain.id] !== 'undefined') {
    dbg('Using cached topUpTokens');
    return cachedTopUpTokens[chain.type][chain.id];
  }

  const { allowMultiTokenTopUp, accumulateNativeToken } =
    configNetworks[chain.type][chain.id].topUp;

  const topUpTokens =
    allowMultiTokenTopUp === true
      ? await getMultiTopUpTokenAmountsForChain(
          txidVersion,
          chain,
          accumulateNativeToken,
        )
      : await getTopUpTokenAmountsForChain(txidVersion, chain);
  if (topUpTokens.length > 0) {
    // only cache if we get a result. don't store empty array.
    cachedTopUpTokens[chain.type][chain.id] = topUpTokens;
  }
  return topUpTokens;
};

export const topUpWallet = async (
  topUpWallet: ActiveWallet,
  txidVersion: TXIDVersion,
  chain: BroadcasterChain,
) => {
  const topUpTokens = await getTopUpTokens(txidVersion, chain);
  // also cache the topUpTokens. this is to prevent it from halting if the balances increase to a point at which
  // the thresholds no longer aremet, and it doesnt get past the check for tokens to use.
  // do it this way instead of attempting to control the quantities of tokens used. just store, as those values are the
  // ones cached in the transaction anyway. so recalculating every time is also unnecessary.

  for (const t of topUpTokens) {
    const { amount, tokenAddress } = t;
    dbg(`Token ${tokenAddress} ${amount.toString()}`);
  }
  // this pulls cached balances anyway after first go until it finishes a top up
  // always check these, otherwise we could end up re-unshielding to this address
  // in the event that, the top up process doesnt complete after unshielding &
  // there are more tokens that can be 'unshielded'
  const unwrappedTokensWaiting = await getPublicERC20AmountsBeforeUnwrap(
    topUpWallet,
    chain,
    true, // force scan here to prevent unecessary additional unshielding.
  );
  // check to see if we have anything.
  const provider = getFirstJsonRpcProviderForNetwork(chain, true);
  const ethersWallet = createEthersWallet(topUpWallet, provider);
  if (unwrappedTokensWaiting.length > 0) {
    dbg('We have tokens awaiting swapping, lets figure it out. ');

    setWalletAvailability(topUpWallet, chain, false, false);
    await handlePublicTokens(
      unwrappedTokensWaiting,
      chain,
      topUpWallet,
      ethersWallet,
    ).catch((err) => {
      // clear the topup cache, if any failure happens here.
      dbg('handlePublicTokens error, clearing caches.');
      setWalletAvailability(topUpWallet, chain, true);
      clearTopUpCaches(chain, topUpWallet);
      throw err;
    });
    setWalletAvailability(topUpWallet, chain, true);
    dbg('Topup complete');
    return;
  }
  if (topUpTokens.length === 0) {
    dbg(
      `No tokens to top up wallet ${topUpWallet.address} on chain ${chain.id}, txidVersion ${txidVersion}`,
    );

    // check to see if we have any tokens to unwrap, maybe the last topup failed?
    // cache these balances per address,
    // clear the cache for address when we fall through this length check.
    // current availalble token balances should be re-gathered

    return;
  }

  // begin topup
  dbg(
    `Begin top up for wallet with address ${topUpWallet.address} and index ${topUpWallet.index} on chain ${chain.type}:${chain.id}, txidVersion ${txidVersion}`,
  );
  const railgunWalletID = getRailgunWalletID();
  setWalletAvailability(topUpWallet, chain, false, false);

  const nonce = await getCurrentWalletNonce(ethersWallet);

  // unshield tokens intended to swap
  const batchResponse = await unshieldTokens(
    txidVersion,
    railgunWalletID,
    configDefaults.engine.dbEncryptionKey,
    topUpWallet.address,
    topUpTokens,
    chain,
  ).catch((err) => {
    setWalletAvailability(topUpWallet, chain, true);
    dbg('unshieldTokens error');

    dbg(err.message);

    // if its arbitrum, gasError happens on first prove each time, idk why?
    const isArbitrum =
      chain.type === ChainType.EVM && chain.id === NetworkChainID.Arbitrum;

    const secondaryCheck = isArbitrum
      ? err.message !== 'there was an error calculating gas details.'
      : err.message !== 'Gas estimate error. Possible connection failure.';

    if (err.message !== 'Top Up too costly, skipping!' && secondaryCheck) {
      clearTopUpCaches(chain, topUpWallet);
      dbg('Clearing Caches');
    }
    throw err;
  });
  await waitForTx(
    topUpWallet,
    ethersWallet,
    chain,
    batchResponse,
    nonce,
    false,
  ).catch((err) => {
    // clear the topup cache, if any failure happens here.
    dbg('WaitForTx error, clearing caches.');

    setWalletAvailability(topUpWallet, chain, true);
    clearTopUpCaches(chain, topUpWallet);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateCachedGasTokenBalance(chain, topUpWallet.address);
    throw err;
  });

  // need to make sure, if the balances change between wallets, and changes which one is actively topped up,
  // the caches will desync and it will attempt to process old info.
  // the unshield & topUpTokens cache soley by chain, instead of by address.
  // it wont matter as long as it follows through, with any address and clears the cache afterwards.
  // the proof & the tokens dont matter, but if one wallet uses the proof with the tokens, and the other address also had a proof with those tokens
  // the second address will just fail.

  // clear the caches
  clearTopUpCaches(chain, topUpWallet);

  // wait 5 seconds to allow tx info to disperse.
  await delay(5000);

  // get public balances
  const publicERC20Amounts = await getPublicERC20AmountsAfterUnwrap(
    topUpWallet,
    chain,
    topUpTokens,
  ).catch((err) => {
    // clear the topup cache, if any failure happens here.
    dbg('getPublicTokenAmountsAfterUnwrap error, clearing caches.');

    setWalletAvailability(topUpWallet, chain, true);
    clearTopUpCaches(chain, topUpWallet);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateCachedGasTokenBalance(chain, topUpWallet.address);
    throw err;
  });
  // .finally(() => {
  //   clearTopUpCaches(chain, topUpWallet);
  // });

  // determine if we are just able to unwrap, or if we should swap.

  await handlePublicTokens(
    publicERC20Amounts,
    chain,
    topUpWallet,
    ethersWallet,
  ).catch((err) => {
    // clear the topup cache, if any failure happens here.
    dbg('handlePublicTokens error, clearing caches.');
    setWalletAvailability(topUpWallet, chain, true);
    clearTopUpCaches(chain, topUpWallet);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateCachedGasTokenBalance(chain, topUpWallet.address);

    throw err;
  });
  // .finally(() => {
  //   clearTopUpCaches(chain, topUpWallet);
  // });
  await updateCachedGasTokenBalance(chain, topUpWallet.address);
  // set wallet available and conclude
  setWalletAvailability(topUpWallet, chain, true);
  dbg('Topup complete');
};

const handlePublicTokens = async (
  publicTokenAmounts: ERC20Amount[],
  chain: BroadcasterChain,
  topUpWallet: ActiveWallet,
  ethersWallet: Wallet,
) => {
  const wrappedNativeTokenAddress =
    getWrappedNativeTokenAddressForChain(chain).toLowerCase();

  const filteredNativeTokens = publicTokenAmounts.filter(
    (token) => token.tokenAddress.toLowerCase() === wrappedNativeTokenAddress,
  );
  const filteredPublicTokens = publicTokenAmounts.filter(
    (token) => token.tokenAddress.toLowerCase() !== wrappedNativeTokenAddress,
  );

  if (filteredNativeTokens.length > 0) {
    // preform unwrap on those tokens
    const unwrapTxResponses = await nativeUnwrap(
      topUpWallet,
      filteredNativeTokens,
      chain,
    );
    await waitForTxs(
      topUpWallet,
      ethersWallet,
      chain,
      unwrapTxResponses,
      false,
    );
    dbg(`Unwrapping on chain ID: ${chain.id} complete.`);
  }

  if (filteredPublicTokens.length > 0) {
    const shouldUseZeroX =
      configNetworks[chain.type][chain.id].topUp.useZeroXForSwap;
    const hasZeroXAPIKey = configDefaults.api.zeroXApiKey !== '';
    if (shouldUseZeroX && hasZeroXAPIKey) {
      dbg('Top-Up Swapping with 0x');

      const approvalTxResponses = await approveZeroX(
        topUpWallet,
        filteredPublicTokens,
        chain,
      );
      await waitForTxs(
        topUpWallet,
        ethersWallet,
        chain,
        approvalTxResponses,
        false,
      );
      dbg('0x Approvals complete');

      const swapZeroXTxResponses = await swapZeroX(
        topUpWallet,
        filteredPublicTokens,
        chain,
      );
      await waitForTxs(
        topUpWallet,
        ethersWallet,
        chain,
        swapZeroXTxResponses,
        false,
      );
    } else {
      dbg('Top-Up Swapping with Uniswap');
      // perform swaps and approvals combined
      await swapUniswap(topUpWallet, filteredPublicTokens, chain);
    }
  }
};

function clearTopUpCaches(chain: BroadcasterChain, topUpWallet: ActiveWallet) {
  dbg('Clearing Topup Cache');
  clearCachedBalances(chain, topUpWallet.address);
  clearCachedTokens(chain);
  clearCachedTransaction(chain);
}
