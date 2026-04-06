import { BroadcasterChain } from '../../../models/chain-models';
import { TokenPrice, TokenPriceUpdater } from '../../tokens/token-price-cache';
import { fetchDefiLlamaPrices, getDefiLlamaChainName } from './defi-llama-fetch';
import { delay } from '../../../util/promise-utils';
import { isDefined } from '@railgun-community/shared-models';

export const defiLlamaUpdatePricesByAddresses = async (
  chain: BroadcasterChain,
  tokenAddresses: string[],
  updater: TokenPriceUpdater,
): Promise<void> => {
  const chainName = getDefiLlamaChainName(chain);
  if (!isDefined(chainName)) {
    return;
  }

  // DefiLlama can handle many tokens, but let's batch reasonably if needed.
  // URL length limits might apply. 50 addresses * 42 chars + overhead ~ 2500 chars.
  // Safe to batch by 30.
  const batchSize = 30;
  
  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    const batch = tokenAddresses.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    const response = await fetchDefiLlamaPrices(chain, batch);
    
    batch.forEach(address => {
        const key = `${chainName}:${address}`;
        const data = response.coins[key];
        if (isDefined(data)) {
            const tokenPrice: TokenPrice = {
                price: data.price,
                updatedAt: Date.now(), // data.timestamp * 1000, // DefiLlama uses seconds
            };
            updater(address, tokenPrice);
        }
    });

    // eslint-disable-next-line no-await-in-loop
    await delay(1000); // Rate limit niceness
  }
};

