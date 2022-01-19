import { BigNumber, PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import configTokens from '../../config/config-tokens';
import { lookUpTokenPrice } from '../tokens/token-price-cache';
import { estimateMaximumGas } from './gas-estimate';

export const calculateFee = async (
  chainID: NetworkChainID,
  tokenAddress: string,
  populatedTransaction: PopulatedTransaction,
): Promise<BigNumber> => {
  const networkConfig = configNetworks[chainID];
  const networkGasToken = networkConfig.gasToken;
  if (!networkGasToken.wrappedAddress) {
    throw new Error(`No gas token address for network: ${chainID}`);
  }
  const tokenConfig = configTokens[chainID][tokenAddress];
  if (!tokenConfig) {
    throw new Error(`Unsupported token: ${tokenAddress}`);
  }

  const tokenPrice = lookUpTokenPrice(chainID, tokenAddress);
  const gasTokenPrice = lookUpTokenPrice(
    chainID,
    networkGasToken.wrappedAddress,
  );

  const priceRatio = gasTokenPrice.price / tokenPrice.price;
  const slippage = priceRatio * networkConfig.fees.slippageBuffer;
  const profit = priceRatio * networkConfig.fees.slippageBuffer;
  const totalFeeRatio = priceRatio + slippage + profit;

  const maximumGas = await estimateMaximumGas(chainID, populatedTransaction);

  // TODO: Take number of decimals for token into account (?)
  const feeForTokenDecimal = Math.ceil(maximumGas.toNumber() * totalFeeRatio);

  return BigNumber.from(feeForTokenDecimal);
};
