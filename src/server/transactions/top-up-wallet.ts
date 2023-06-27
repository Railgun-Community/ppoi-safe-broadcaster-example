import { ERC20Amount } from '../../models/token-models';
import { ActiveWallet } from '../../models/wallet-models';
import { zeroXGetSwapQuote } from '../api/0x/0x-quote';
import { getERC20TokenBalance } from '../balances/erc20-token-balance';
import configNetworks from '../config/config-networks';
import { networkTokens } from '../tokens/network-tokens';
import {
  createEthersWallet,
  getRailgunWalletID,
} from '../wallets/active-wallets';
import { setWalletAvailability } from '../wallets/available-wallets';
import { unshieldTokens } from './unshield-tokens';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getCurrentNonce, waitForTx, waitForTxs } from './execute-transaction';
import { approveZeroX } from './approve-spender';
import configDefaults from '../config/config-defaults';
import { swapZeroX } from './0x-swap';
import {
  getPrivateTokenBalanceCache,
  ShieldedCachedBalance,
  updateShieldedBalances,
} from '../balances/shielded-balance-cache';
import { removeUndefineds } from '../../util/utils';
import { RelayerChain } from '../../models/chain-models';
import debug from 'debug';
import { isDefined } from '@railgun-community/shared-models';

const dbg = debug('relayer:topup');

const getPublicERC20AmountsAfterUnwrap = async (
  wallet: ActiveWallet,
  chain: RelayerChain,
): Promise<ERC20Amount[]> => {
  const allTokens = networkTokens[chain.type][chain.id];
  const newPublicERC20Amounts: ERC20Amount[] = await Promise.all(
    allTokens.map(async (token) => {
      const amt = await getERC20TokenBalance(chain, wallet.address, token);
      const erc20Amount: ERC20Amount = {
        tokenAddress: token.address,
        amount: amt,
      };
      return erc20Amount;
    }),
  );
  return newPublicERC20Amounts;
};

const getShieldedERC20AmountsForChain = async (
  chain: RelayerChain,
): Promise<ShieldedCachedBalance[]> => {
  const fullRescan = false;
  await updateShieldedBalances(chain, fullRescan);
  const shieldedBalancesForChain = getPrivateTokenBalanceCache(chain);
  return shieldedBalancesForChain;
};

// Currently unused.
// export const filterTopUpTokens = (
//   topUpTokens: ERC20Amount[],
// ): ERC20Amount[] => {
//   // const desiredTopUpTokens = [];
//   // const desiredTopUpTokens: Optiona<ERC20Amount>[] = await Promise.all (
//   //   topUpTokens.map( async (erc20Amount) => {
//   //       if (!configDefaults.topUps.shouldNotSwap.includes(erc20Amount.tokenAddress)){
//   //         return
//   //       }
//   //     }
//   //   )
//   // )
//   return [topUpTokens[0]];
// };

export const getTopUpERC20AmountsForChain = async (
  chain: RelayerChain,
): Promise<ERC20Amount[]> => {
  const erc20AmountsForChain = await getShieldedERC20AmountsForChain(chain);

  const topUpERC20AmountsForChain: Optional<ERC20Amount>[] = await Promise.all(
    erc20AmountsForChain.map(async (shieldedTokenCache) => {
      const gasTokenSymbol =
        configNetworks[chain.type][chain.id].gasToken.symbol;

      const erc20AmountInGasToken = await zeroXGetSwapQuote(
        chain,
        shieldedTokenCache.erc20Amount,
        gasTokenSymbol,
        configDefaults.topUps.toleratedSlippage,
      );
      try {
        const amount = erc20AmountInGasToken.quote?.buyERC20Amount.amount;
        if (
          isDefined(amount) &&
          amount > BigInt(configDefaults.topUps.swapThresholdIntoGasToken)
        ) {
          return shieldedTokenCache.erc20Amount;
        }
        return undefined;
      } catch (err) {
        dbg(`Quote for token failed - ${err.message}`);
        throw err;
      }
    }),
  );
  return removeUndefineds(topUpERC20AmountsForChain);
};

export const topUpWallet = async (
  topUpWallet: ActiveWallet,
  chain: RelayerChain,
) => {
  const topUpTokens = await getTopUpERC20AmountsForChain(chain);

  if (topUpTokens.length === 0) {
    dbg(
      `No tokens to top up wallet ${topUpWallet.address} on chain ${chain.id}`,
    );
    return;
  }

  // begin topup
  dbg(
    `Begin top up for wallet with address ${topUpWallet.address} and index ${topUpWallet.index} on chain ${chain.type}:${chain.id}`,
  );

  const railgunWalletID = getRailgunWalletID();

  setWalletAvailability(topUpWallet, chain, false);
  const provider = getProviderForNetwork(chain);
  const ethersWallet = createEthersWallet(topUpWallet, provider);
  const nonce = await getCurrentNonce(chain, ethersWallet);

  // unshield tokens intended to swap
  const batchResponse = await unshieldTokens(
    railgunWalletID,
    configDefaults.engine.dbEncryptionKey,
    topUpWallet.address,
    topUpTokens,
    chain,
  );
  await waitForTx(topUpWallet, ethersWallet, chain, batchResponse, nonce);

  // get public balances
  const publicERC20Amounts = await getPublicERC20AmountsAfterUnwrap(
    topUpWallet,
    chain,
  );

  // perform approvals
  const approvalTxResponses = await approveZeroX(
    topUpWallet,
    publicERC20Amounts,
    chain,
  );
  await waitForTxs(topUpWallet, ethersWallet, chain, approvalTxResponses);
  dbg('Approvals complete');

  // perform swaps
  const swapTxResponses = await swapZeroX(
    topUpWallet,
    publicERC20Amounts,
    chain,
  );
  await waitForTxs(topUpWallet, ethersWallet, chain, swapTxResponses);

  // set wallet available and conclude
  setWalletAvailability(topUpWallet, chain, true);
  dbg('Topup complete');
};
