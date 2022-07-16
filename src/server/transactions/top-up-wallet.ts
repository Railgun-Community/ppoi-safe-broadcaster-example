import debug from 'debug';
import { TokenAmount } from '../../models/token-models';
import { ActiveWallet } from '../../models/wallet-models';
import { zeroXGetSwapQuote } from '../api/0x/0x-quote';
import { getERC20TokenBalance } from '../balances/erc20-token-balance';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';
import { networkTokens } from '../tokens/network-tokens';
import {
  createEthersWallet,
  getRailgunWallet,
} from '../wallets/active-wallets';
import { setWalletAvailability } from '../wallets/available-wallets';
import configTopup from '../config/config-topup';
import { getLepton } from '../lepton/lepton-init';
import { unshieldTokens } from './unshield-tokens';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getCurrentNonce, waitForTx, waitForTxs } from './execute-transaction';
import { approveZeroX } from './approve-spender';
import configWalletTopUpRefresher from '../config/config-wallet-topup-refresher';
import configDefaults from '../config/config-defaults';
import { swapZeroX } from './0x-swap';
import {
  getPrivateTokenBalanceCache,
  ShieldedCachedBalance,
  updateCachedShieldedBalances,
} from '../balances/shielded-balance-cache';
import { removeUndefineds } from '../../util/utils';

const dbg = debug('relayer:topup');

const getPublicTokenAmountsAfterUnwrap = async (
  wallet: ActiveWallet,
  chainID: NetworkChainID,
): Promise<TokenAmount[]> => {
  const allTokens = networkTokens[chainID];
  const newPublicTokenAmounts: TokenAmount[] = await Promise.all(
    allTokens.map(async (token) => {
      const amt = await getERC20TokenBalance(chainID, wallet.address, token);
      const tokenAmount: TokenAmount = {
        tokenAddress: token.address,
        amount: amt,
      };
      return tokenAmount;
    }),
  );
  return newPublicTokenAmounts;
};

const getShieldedTokenAmountsForChain = async (
  chainID: NetworkChainID,
): Promise<ShieldedCachedBalance[]> => {
  const wallet = getRailgunWallet();
  await updateCachedShieldedBalances(wallet, chainID);
  const shieldedBalancesForChain = getPrivateTokenBalanceCache(chainID);
  return shieldedBalancesForChain;
};

export const getTopUpTokenAmountsForChain = async (
  chainID: NetworkChainID,
): Promise<TokenAmount[]> => {
  const tokenAmountsForChain = await getShieldedTokenAmountsForChain(chainID);

  const topUpTokenAmountsForChain: Optional<TokenAmount>[] = await Promise.all(
    tokenAmountsForChain.map(async (shieldedTokenCache) => {
      const gasTokenSymbol = configNetworks[chainID].gasToken.symbol;

      const tokenAmountInGasToken = await zeroXGetSwapQuote(
        chainID,
        shieldedTokenCache.tokenAmount,
        gasTokenSymbol,
        configWalletTopUpRefresher.toleratedSlippage,
      );
      try {
        if (
          tokenAmountInGasToken.quote?.buyTokenAmount.amount.gt(
            configTopup.amountInGasToken,
          )
        ) {
          return shieldedTokenCache.tokenAmount;
        }
        return undefined;
      } catch (err) {
        dbg(`Quote for token failed - ${err.message}`);
        throw err;
      }
    }),
  );
  return removeUndefineds(topUpTokenAmountsForChain);
};

export const topUpWallet = async (
  topUpWallet: ActiveWallet,
  chainID: NetworkChainID,
) => {
  // begin topup
  dbg(
    `Begin top up for wallet with address ${topUpWallet.address} and index ${topUpWallet.index} on chain ${chainID}`,
  );

  // get relevant data for transactions
  const railWallet = getRailgunWallet();
  const { prover } = getLepton();

  setWalletAvailability(topUpWallet, chainID, false);
  const topUpTokens = await getTopUpTokenAmountsForChain(chainID);
  const provider = getProviderForNetwork(chainID);
  const ethersWallet = createEthersWallet(topUpWallet, provider);
  const nonce = await getCurrentNonce(chainID, ethersWallet);

  // unshield tokens intended to swap
  const batchResponse = await unshieldTokens(
    prover,
    railWallet,
    configDefaults.lepton.dbEncryptionKey,
    topUpWallet.address,
    false, // allowOveride
    topUpTokens,
    chainID,
  );
  await waitForTx(topUpWallet, ethersWallet, chainID, batchResponse, nonce);

  // get public balances
  const publicTokenAmounts = await getPublicTokenAmountsAfterUnwrap(
    topUpWallet,
    chainID,
  );

  // perform approvals
  const approvalTxResponses = await approveZeroX(
    topUpWallet,
    publicTokenAmounts,
    chainID,
  );
  await waitForTxs(topUpWallet, ethersWallet, chainID, approvalTxResponses);
  dbg('Approvals complete');

  // perform swaps
  const swapTxResponses = await swapZeroX(
    topUpWallet,
    publicTokenAmounts,
    chainID,
  );
  await waitForTxs(topUpWallet, ethersWallet, chainID, swapTxResponses);

  // set wallet available and conclude
  setWalletAvailability(topUpWallet, chainID, true);
  dbg('Topup complete');
};
