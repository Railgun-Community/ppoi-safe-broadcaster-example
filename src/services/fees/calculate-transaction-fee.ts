import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configNetworks from '../../config/config-networks';
import configTokens from '../../config/config-tokens';
import { lookUpCachedTokenPrice } from '../tokens/token-price-cache';
import { deserializePopulatedTransaction } from '../transactions/populated-transaction';
import { estimateMaximumGas } from './gas-estimate';
import { cacheFeeForTransaction } from './transaction-fee-cache';

export const calculateTransactionFee = async (
  chainID: NetworkChainID,
  serializedTransaction: string,
  tokenAddress: string,
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

  const tokenPrice = lookUpCachedTokenPrice(chainID, tokenAddress);
  const gasTokenPrice = lookUpCachedTokenPrice(
    chainID,
    networkGasToken.wrappedAddress,
  );

  const priceRatio = gasTokenPrice.price / tokenPrice.price;
  const slippage = priceRatio * networkConfig.fees.slippageBuffer;
  const profit = priceRatio * networkConfig.fees.slippageBuffer;
  const totalFeeRatio = priceRatio + slippage + profit;

  const populatedTransaction = deserializePopulatedTransaction(
    serializedTransaction,
  );
  const maximumGas = await estimateMaximumGas(chainID, populatedTransaction);

  // TODO: Take number of decimals for token into account (?)
  const feeForTokenDecimal = Math.ceil(maximumGas.toNumber() * totalFeeRatio);

  cacheFeeForTransaction(
    serializedTransaction,
    tokenAddress,
    feeForTokenDecimal,
  );

  return BigNumber.from(feeForTokenDecimal);
};
