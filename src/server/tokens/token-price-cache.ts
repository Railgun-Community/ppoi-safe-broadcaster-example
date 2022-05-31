import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';
import { GasTokenConfig, Token } from '../../models/token-models';
import { logger } from '../../util/logger';
import { resetMapObject } from '../../util/utils';
import { tokenForAddress } from './network-tokens';

export enum TokenPriceSource {
  CoinGecko = 'CoinGecko',
  ZeroX = '0x',
}

export type TokenPrice = {
  price: number;
  updatedAt: number; // In milliseconds.
};

export type TokenPriceUpdater = (
  tokenAddress: string,
  tokenPrice: TokenPrice,
) => void;

type TokenAddressesToPrice = MapType<Optional<TokenPrice>>;

// Cached token prices per network.
// {source: {chainID: {address: TokenPrice}}}
const tokenPriceCache: MapType<NumMapType<TokenAddressesToPrice>> = {};

export const cacheTokenPriceForNetwork = (
  source: TokenPriceSource,
  chainID: NetworkChainID,
  tokenAddress: string,
  tokenPrice: TokenPrice,
) => {
  if (!tokenPriceCache[source]) {
    tokenPriceCache[source] = {};
  }
  if (!tokenPriceCache[source][chainID]) {
    tokenPriceCache[source][chainID] = {};
  }
  tokenPriceCache[source][chainID][tokenAddress.toLowerCase()] = {
    price: tokenPrice.price,
    updatedAt: tokenPrice.updatedAt,
  };
  logger.log(
    `${source} [${chainID}]: Cache price $${tokenPrice.price} for token ${tokenAddress}`,
  );
};

export const resetTokenPriceCache = () => {
  resetMapObject(tokenPriceCache);
};

export const getTokenPriceCache = () => {
  return tokenPriceCache;
};

const logTokenLookupError = (
  errorMsg: string,
  chainID: NetworkChainID,
  tokenAddress: string,
) => {
  const tokenSymbol = tokenForAddress(chainID, tokenAddress).symbol;
  const tokenDetails = `${tokenSymbol} on ${configNetworks[chainID].name} (${tokenAddress})`;
  logger.warn(`${errorMsg}: ${tokenDetails}`);
};

export const cachedTokenPriceForSource = (
  source: TokenPriceSource,
  chainID: NetworkChainID,
  tokenAddress: string,
): Optional<TokenPrice> => {
  const pricesForSource = tokenPriceCache[source];
  if (!pricesForSource) {
    return undefined;
  }
  const cachedNetworkPrices = pricesForSource[chainID];
  if (!cachedNetworkPrices) {
    logTokenLookupError(`[${source}] No network prices`, chainID, tokenAddress);
    return undefined;
  }

  const cachedPrice = cachedNetworkPrices[tokenAddress];
  if (!cachedPrice) {
    // No cached price for this source/network. Likely still loading.
    return undefined;
  }

  // Token price expired (configurable per network: priceTTLInMS).
  const networkPriceTTLInMs = configNetworks[chainID].priceTTLInMS;
  const expiration = cachedPrice.updatedAt + networkPriceTTLInMs;
  const priceExpired = expiration < Date.now();
  if (priceExpired) {
    const expirationTimeLapsed = Date.now() - expiration;
    logTokenLookupError(
      `[${source}] Token price expired by ${expirationTimeLapsed} ms`,
      chainID,
      tokenAddress,
    );
    return undefined;
  }

  return cachedPrice;
};

const getAverageCachedTokenPrice = (
  chainID: NetworkChainID,
  tokenAddress: string,
): Optional<number> => {
  const tokenPrices: TokenPrice[] = [];

  Object.values(TokenPriceSource).forEach((source) => {
    const cachedPrice = cachedTokenPriceForSource(
      source,
      chainID,
      tokenAddress,
    );
    if (cachedPrice) {
      tokenPrices.push(cachedPrice);
    }
  });

  if (!tokenPrices.length) {
    return undefined;
  }

  const prices = tokenPrices.map((t) => t.price);
  const averageValidPrice = prices.reduce((a, b) => a + b) / tokenPrices.length;
  return averageValidPrice;
};

export const lookUpCachedTokenPrice = (
  chainID: NetworkChainID,
  tokenAddress: string,
): number => {
  const cachedPrice = getAverageCachedTokenPrice(
    chainID,
    tokenAddress.toLowerCase(),
  );

  // No price available.
  if (!cachedPrice) {
    logTokenLookupError('NO TOKEN PRICE', chainID, tokenAddress);
    throw new Error(`No cached price for token: ${tokenAddress}`);
  }

  return cachedPrice;
};

export const getTransactionTokenPrices = (
  chainID: NetworkChainID,
  token: Token,
  gasToken: GasTokenConfig,
): { gasTokenPrice: number; tokenPrice: number } => {
  const tokenPrice = lookUpCachedTokenPrice(chainID, token.address);
  const gasTokenPrice = lookUpCachedTokenPrice(
    chainID,
    gasToken.wrappedAddress,
  );
  return {
    tokenPrice,
    gasTokenPrice,
  };
};
