import {
  delay,
  TXIDVersion,
  promiseTimeout,
} from '@railgun-community/shared-models';
import debug from 'debug';
import { formatEther, formatUnits, parseUnits } from 'ethers';
import { BroadcasterChain } from '../../models/chain-models';
import { ERC20Amount } from '../../models/token-models';
import { removeUndefineds } from '../../util/utils';
import {
  getPrivateTokenBalanceCache,
  ShieldedCachedBalance,
  updateShieldedBalances,
} from '../balances/shielded-balance-cache';
import { getWrappedNativeTokenAddressForChain } from '../balances/top-up-balance';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import configDefaults from '../config/config-defaults';
import configNetworks from '../config/config-networks';
import { getTokenPricesFromCachedPrices } from '../fees/calculate-token-fee';
import { getTransactionTokens } from '../tokens/network-tokens';

const dbg = debug('broadcaster:topup-util');

const initialRun: NumMapType<NumMapType<boolean>> = {};

export const pollRefreshBalances = async () => {
  const txidVersion = TXIDVersion.V2_PoseidonMerkle;
  dbg('Polling refresh balances');
  const chains = configuredNetworkChains();
  for (const chain of chains) {
    // eslint-disable-next-line no-await-in-loop
    await promiseTimeout(
      updateShieldedBalances(txidVersion, chain),
      5 * 60 * 1000,
    ).catch((err: Error) => {
      dbg('UPDATE SHIELD ERROR');

      dbg(err.message);
    });
    // eslint-disable-next-line no-await-in-loop
    await delay(1000);
  }
  await delay(5 * 60 * 1000);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  pollRefreshBalances();
};

const getShieldedTokenAmountsForChain = async (
  txidVersion: TXIDVersion,
  chain: BroadcasterChain,
): Promise<ShieldedCachedBalance[]> => {
  const shieldedBalancesForChain = getPrivateTokenBalanceCache(chain);

  initialRun[chain.type] ??= {};
  initialRun[chain.type][chain.id] ??= true;

  const isInitialRun = initialRun[chain.type][chain.id];
  let forceRefresh = isInitialRun;
  initialRun[chain.type][chain.id] = false;

  if (forceRefresh === false) {
    forceRefresh = shieldedBalancesForChain.length === 0;
  }

  if (forceRefresh) {
    const updatedBalances = getPrivateTokenBalanceCache(chain);
    return updatedBalances;
  }
  return shieldedBalancesForChain;
};

const shouldTopUpToken = (tokenAddress: string) => {
  for (const token of configDefaults.topUps.shouldNotSwap) {
    if (token.toLowerCase() === tokenAddress) return false;
  }

  return true;
};

type TokenTopUpCache = {
  tokenAmount: ERC20Amount;
  swapValue: bigint;
};

const decendingTokenSort = (a: TokenTopUpCache, b: TokenTopUpCache): number => {
  if (a.swapValue < b.swapValue) return 1;
  if (a.swapValue > b.swapValue) return -1;
  return 0;
};

const orderNativeTokenLast = (
  tokenAmounts: TokenTopUpCache[],
  nativeAddress: string,
): TokenTopUpCache[] => {
  const nonNative = tokenAmounts.filter(
    (token) => token.tokenAmount.tokenAddress !== nativeAddress,
  );
  const nativeToken = tokenAmounts.filter(
    (token) => token.tokenAmount.tokenAddress === nativeAddress,
  );

  return [...nonNative, ...nativeToken];
};

const getConsolidatedTokenAmounts = (
  tokenAmounts: Optional<TokenTopUpCache>[],
  chain: BroadcasterChain,
): Optional<ERC20Amount>[] => {
  let totalSwapValue = 0n;
  const topUpThreshold =
    configNetworks[chain.type][chain.id].topUp.swapThresholdIntoGasToken;

  const consolidatedAmounts: ERC20Amount[] = [];
  for (const tokenCache of tokenAmounts) {
    if (totalSwapValue >= topUpThreshold) {
      continue;
    }
    if (tokenCache) {
      const { tokenPrice, gasTokenPrice } = getTokenPricesFromCachedPrices(
        chain,
        tokenCache.tokenAmount.tokenAddress,
      );
      const { token, gasToken } = getTransactionTokens(
        chain,
        tokenCache.tokenAmount.tokenAddress,
      );
      const swapAmount = tokenCache.swapValue;
      const tokenInfo = tokenCache.tokenAmount;
      const remainsToFill = topUpThreshold - totalSwapValue - swapAmount;
      if (remainsToFill < 0) {
        // get the inverse value, this is how much we're over.
        const inverseRemains = remainsToFill * -1n;
        // convert the inverseRemains into value of token
        const readableRemains = parseFloat(
          formatEther(inverseRemains.toString()),
        );
        const readableCost = readableRemains * gasTokenPrice;
        const convertedAmount = readableCost / tokenPrice;
        // convert back into evm
        const decimalLimit = convertedAmount > 1 ? 2 : 6;
        const overSpentAmount = parseUnits(
          convertedAmount.toFixed(decimalLimit),
          token.decimals,
        );
        const finalizedAmount = tokenInfo.amount - overSpentAmount;
        tokenInfo.amount = finalizedAmount;
      }

      // this check prevents small chunks being used.
      if (token.address === gasToken.wrappedAddress) {
        // if the token is the gasToken wrapped, check to see if its value is over 50% of the unshield.
        const useNativeThreshold = (topUpThreshold * 33n) / 100n;
        if (!(tokenInfo.amount > useNativeThreshold)) {
          dbg(
            `nativeToken amount is not enough ${token.address} ${formatUnits(
              tokenInfo.amount,
              token.decimals,
            )}`,
          );
          continue;
        }
      } else {
        // make sure the unshield amount is atleast 30% of the overall
        const usePublicThreshold = (topUpThreshold * 25n) / 100n;

        // format into humanReadable. and value.
        const humanReadablePublicThreshold = formatEther(usePublicThreshold);
        const priceConvertedValue =
          parseFloat(humanReadablePublicThreshold) * gasTokenPrice;

        const publicTokenConverted = priceConvertedValue / tokenPrice;
        // convert this back to the other token.
        const decimalLimit = publicTokenConverted > 1 ? 2 : 6;

        // convert this into the decimal amount.
        const convertedThreshold = parseUnits(
          publicTokenConverted.toFixed(decimalLimit),
          token.decimals,
        );
        if (tokenInfo.amount > convertedThreshold === false) {
          dbg(
            `token amount not enough ${token.address} ${formatUnits(
              tokenInfo.amount,
              token.decimals,
            )}`,
          );
          continue;
          // return undefined;
        }
      }
      // convert the new swapAmount to keep track.
      // we want to split it up into thirds to keep the tx's atleast somewhat smart with the 'funding used'
      // max publicToken 2/3 min public token 1/3 this should keep any hiccups at bay.
      totalSwapValue += swapAmount;
      // dbg(`totalSwapValue: ${totalSwapValue}`);
      consolidatedAmounts.push(tokenInfo);
    }
  }
  // the current issue is if a check fails to allow one of the 'remaining' tokens but has enough to pass the native check
  // it will allow native to fall through to here.
  // inversely the same the other way I would assume.
  if (totalSwapValue <= (topUpThreshold * 95n) / 100n) return [];

  return consolidatedAmounts;
};

export const getMultiTopUpTokenAmountsForChain = async (
  txidVersion: TXIDVersion,
  chain: BroadcasterChain,
  setNativeLast: boolean,
): Promise<ERC20Amount[]> => {
  const tokenAmountsForChain = await getShieldedTokenAmountsForChain(
    txidVersion,
    chain,
  );
  const topUpThreshold =
    configNetworks[chain.type][chain.id].topUp.swapThresholdIntoGasToken;

  const tokenAmounts = tokenAmountsForChain.map((amt) => {
    return { erc20Amount: { ...amt.erc20Amount }, updatedAt: amt.updatedAt };
  });

  const topUpTokenAmountsForChain: TokenTopUpCache[] = [];
  for (const shieldedTokenCache of tokenAmounts) {
    const { tokenAddress, amount } = shieldedTokenCache.erc20Amount;
    if (!shouldTopUpToken(tokenAddress)) continue;
    // use this to determine the quantity of tokenAmount to process?
    const { token, gasToken } = getTransactionTokens(chain, tokenAddress);
    const { tokenPrice, gasTokenPrice } = getTokenPricesFromCachedPrices(
      chain,
      tokenAddress,
    );

    let tokenAmount;
    const tmpTokenInfo = shieldedTokenCache.erc20Amount;
    if (token.address === gasToken.wrappedAddress) {
      tokenAmount = parseFloat(formatEther(amount.toString()));
    } else {
      // figure out what the 2/3 max amount is. if amount is > set the 2/3 value as its availability.
      // compute topUpThreshold in tokenAmount as well.
      // if value is larger than topUpThreshold. just use the single token.
      const usageThreshold = (topUpThreshold * 33n) / 100n;

      const maxUsageThreshold = parseFloat(
        formatUnits(usageThreshold.toString(), gasToken.decimals),
      );

      const maxFillTreshold = parseFloat(
        formatUnits(topUpThreshold.toString(), gasToken.decimals),
      );
      const convertedMaxFill = (maxFillTreshold * gasTokenPrice) / tokenPrice;
      const maxFillDecimalLimit = convertedMaxFill > 1 ? 2 : 8;
      // this is in gasToken humanReadable.
      // convert back into value of token, then figure out what the amount in token is
      const convertAmount = (maxUsageThreshold * gasTokenPrice) / tokenPrice;
      const decimalLimit = convertAmount > 1 ? 2 : 8;

      const publicTokenConverted = parseUnits(
        convertAmount.toFixed(decimalLimit),
        token.decimals,
      );
      const maxFillAsPublicToken = parseUnits(
        convertedMaxFill.toFixed(maxFillDecimalLimit),
        token.decimals,
      );
      // if the 2/3 threshold is less than the amount
      // or if the total amount in gasToken is gt the amount
      // otherwise we send it all. soo that should limit it to these scenarios:
      // limit size to 2/3:
      //  - token value is greater than the 2/3 value but less than the total to 'unshield' as 1 token.
      // unshield as 1 token if value is enough to complete
      // token value less than 2/3 rule. just send the amount to be further processed.
      if (publicTokenConverted < amount && maxFillAsPublicToken > amount) {
        tmpTokenInfo.amount = publicTokenConverted;
        tokenAmount =
          (parseFloat(
            formatUnits(publicTokenConverted.toString(), token.decimals),
          ) *
            tokenPrice) /
          gasTokenPrice;
      } else {
        tokenAmount =
          (parseFloat(formatUnits(amount.toString(), token.decimals)) *
            tokenPrice) /
          gasTokenPrice;
      }
    }

    const tokenAmountInGasToken = parseUnits(
      tokenAmount.toFixed(8),
      gasToken.decimals,
    );

    // dbg('token amount', tokenAmountInGasToken);

    // instead lets use the cached prices, otherwise we're going to be leaking info about our balances with each api call.
    try {
      // alter the tokenamount to be only the swap threshold. so we don't inflate the bag
      const topUpAmount = tmpTokenInfo;

      topUpTokenAmountsForChain.push({
        tokenAmount: topUpAmount,
        swapValue: tokenAmountInGasToken,
      });
    } catch (err) {
      dbg(`Quote for token failed - ${err.message}`);
      throw err;
    }
  }
  // dbg('top up amounts', topUpTokenAmountsForChain);
  // sort the array by swapValue here.
  topUpTokenAmountsForChain.sort(decendingTokenSort);
  const nativeWrappedToken = getWrappedNativeTokenAddressForChain(chain);

  let newSortedTopUpList = topUpTokenAmountsForChain.map((amt) => {
    return { tokenAmount: { ...amt.tokenAmount }, swapValue: amt.swapValue };
  });

  if (!setNativeLast) {
    const tempAmounts = [];
    let tempNative;
    let nativeValueEnough = false;
    for (const token of topUpTokenAmountsForChain) {
      if (
        token.tokenAmount.tokenAddress.toLowerCase() ===
        nativeWrappedToken.toLowerCase()
      ) {
        // we found the nativeToken, see if its larger than the threshold.
        if (token.tokenAmount.amount > topUpThreshold) {
          nativeValueEnough = true;
        }
        tempNative = token;
      } else {
        tempAmounts.push(token);
      }
    }
    if (nativeValueEnough && tempNative) {
      // reformat the topUpTokenAmountsForChain
      newSortedTopUpList = [tempNative, ...tempAmounts];
    }
  }

  // if not using the accumulateNative feature,
  // we should force the native token to the front of the list,
  const consolidatedTokenAmountsForChain = getConsolidatedTokenAmounts(
    setNativeLast
      ? orderNativeTokenLast(
          topUpTokenAmountsForChain,
          getWrappedNativeTokenAddressForChain(chain),
        )
      : newSortedTopUpList,
    chain,
  );

  const noDuplicates = removeDuplicates(consolidatedTokenAmountsForChain);
  const result = removeUndefineds(noDuplicates);

  dbg(
    `Base: ${tokenAmountsForChain.length} Orig: ${topUpTokenAmountsForChain.length} No Dups: ${noDuplicates.length} Result ${result.length}`,
  );
  if (result.length > 0) {
    return result;
  }
  dbg(`'Failed to get a result token' chainid ${chain.id}`);

  if (setNativeLast) {
    dbg(`Retrying attempt of finding tokens to unshield.`);
    const retry = await getMultiTopUpTokenAmountsForChain(
      txidVersion,
      chain,
      false,
    );
    return retry;
  }

  return [];
};

export const getTopUpTokenAmountsForChain = async (
  txidVersion: TXIDVersion,
  chain: BroadcasterChain,
): Promise<ERC20Amount[]> => {
  const tokenAmountsForChain = await getShieldedTokenAmountsForChain(
    txidVersion,
    chain,
  );
  const topUpTokenAmountsForChain: Optional<ERC20Amount>[] = [];

  for (const shieldedTokenCache of tokenAmountsForChain) {
    const { tokenAddress, amount } = shieldedTokenCache.erc20Amount;
    if (!shouldTopUpToken(tokenAddress)) continue;
    // use this to determine the quantity of tokenAmount to process?
    const topUpThreshold =
      configNetworks[chain.type][chain.id].topUp.swapThresholdIntoGasToken;

    const { token, gasToken } = getTransactionTokens(chain, tokenAddress);

    const { tokenPrice, gasTokenPrice } = getTokenPricesFromCachedPrices(
      chain,
      tokenAddress,
    );

    let tokenAmount;
    if (token.address === gasToken.wrappedAddress) {
      tokenAmount = parseFloat(formatEther(amount.toString()));
    } else {
      tokenAmount =
        (parseFloat(formatEther(amount.toString())) * tokenPrice) /
        gasTokenPrice;
    }

    const tokenAmountInGasToken = parseUnits(
      tokenAmount.toString(),
      gasToken.decimals,
    );

    // instead lets use the cached prices, otherwise we're going to be leaking info about our balances with each api call.
    try {
      if (tokenAmountInGasToken > topUpThreshold) {
        // alter the tokenAmount to be only the swap threshold. so we don't inflate the bag
        const topUpAmount = shieldedTokenCache.erc20Amount;
        if (token.address === gasToken.wrappedAddress) {
          topUpAmount.amount = topUpThreshold;
        } else {
          // convert non gasToken amount into gasToken equivalent.
          const convertedGasTokenAmount =
            (parseFloat(formatEther(topUpThreshold.toString())) *
              gasTokenPrice) /
            tokenPrice;
          topUpAmount.amount = parseUnits(
            convertedGasTokenAmount.toString(),
            token.decimals,
          );
        }
        topUpTokenAmountsForChain.push(topUpAmount);
      }
    } catch (err) {
      dbg(`Quote for token failed - ${err.message}`);
      throw err;
    }
  }

  const noDuplicates = removeDuplicates(topUpTokenAmountsForChain);
  const result = removeUndefineds(noDuplicates);

  dbg(
    `Base: ${tokenAmountsForChain.length} Orig: ${topUpTokenAmountsForChain.length} No Dups: ${noDuplicates.length} Result ${result.length}`,
  );
  if (result.length > 0) {
    // prefer nativeToken first if found.
    const nativeTokenAddress = getWrappedNativeTokenAddressForChain(chain);
    const nativeToken = result.filter(
      (native) => native.tokenAddress === nativeTokenAddress,
    );
    const publicTokens = result.filter(
      (pubToken) => pubToken.tokenAddress !== nativeTokenAddress,
    );
    if (nativeToken.length > 0) {
      dbg('Native token Selected');
      dbg(`${nativeToken.length} ${JSON.stringify(nativeToken)}`);
      return [nativeToken[0]];
    }

    if (publicTokens.length > 0) {
      dbg('Public token Selected');
      dbg(`${publicTokens.length} ${JSON.stringify(publicTokens)}`);
      return [publicTokens[0]];
    }
  }
  dbg(`Failed to get a result token chainid ${chain.id}`);

  return [];
};

const removeDuplicates = (tokens: Optional<ERC20Amount>[]): ERC20Amount[] => {
  const cached: string[] = [];
  const result: ERC20Amount[] = [];
  tokens.forEach((token) => {
    if (token) {
      if (!cached.includes(token.tokenAddress)) {
        cached.push(token.tokenAddress);
        result.push(token);
      }
    }
  });
  return result;
};

export const cachedTopUpTokens: NumMapType<NumMapType<ERC20Amount[]>> = {};
export const initTopUpTokenCache = (chain: BroadcasterChain) => {
  cachedTopUpTokens[chain.type] ??= {};
};

export const clearCachedTokens = (chain: BroadcasterChain) => {
  initTopUpTokenCache(chain);
  if (typeof cachedTopUpTokens[chain.type][chain.id] !== 'undefined')
    delete cachedTopUpTokens[chain.type][chain.id];
};
