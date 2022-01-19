import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import configTokens from '../../config/config-tokens';
import { logger } from '../../util/logger';

export type TokenPrice = {
  price: number;
  updatedAt: number;
};

export type TokenAddressesToPrice = MapType<Optional<TokenPrice>>;

// Cached token prices per network.
// {chainID: {address: TokenPrice}}
const tokenPriceCache: NumMapType<TokenAddressesToPrice> = {};

export const cacheTokenPricesForNetwork = (
  chainID: NetworkChainID,
  tokenPrices: TokenAddressesToPrice,
) => {
  logger.log(
    `[temp] token prices for chain ${chainID}: ${JSON.stringify(tokenPrices)}`,
  );
  tokenPriceCache[chainID] = tokenPrices;
};

const logTokenLookupError = (
  errorMsg: string,
  chainID: NetworkChainID,
  tokenAddress: string,
) => {
  const tokenSymbol = configTokens[chainID][tokenAddress].symbol;
  const tokenDetails = `${tokenSymbol} on ${configNetworks[chainID].name} (${tokenAddress})`;
  logger.warn(`${errorMsg}: ${tokenDetails}`);
};

export const lookUpTokenPrice = (
  chainID: NetworkChainID,
  tokenAddress: string,
): TokenPrice => {
  const cachedNetworkPrices = tokenPriceCache[chainID];
  if (!cachedNetworkPrices) {
    logTokenLookupError('NO NETWORK PRICES', chainID, tokenAddress);
    throw new Error(`No prices cached for network: ${chainID}`);
  }

  const cachedPrice = cachedNetworkPrices[tokenAddress.toLowerCase()];

  // No price available.
  if (!cachedPrice) {
    logTokenLookupError('NO TOKEN PRICE', chainID, tokenAddress);
    throw new Error(`No cached price for token: ${tokenAddress}`);
  }

  // Token price expired (configurable per network: priceTTLInMS).
  const networkPriceTTLInMs = configNetworks[chainID].priceTTLInMS;
  const expiration = cachedPrice.updatedAt + networkPriceTTLInMs;
  const priceExpired = expiration < Date.now();
  if (priceExpired) {
    const expirationTimeLapsed = Date.now() - expiration;
    logTokenLookupError(
      `TOKEN PRICE EXPIRED by ${expirationTimeLapsed} ms`,
      chainID,
      tokenAddress,
    );
    throw new Error(`Price expired for token: ${tokenAddress}`);
  }

  return cachedPrice;
};
