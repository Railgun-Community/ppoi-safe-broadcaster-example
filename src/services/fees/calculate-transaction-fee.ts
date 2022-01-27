import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../config/config-chain-ids';
import configDefaults from '../../config/config-defaults';
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

  const precision = configDefaults.transactionFeePrecision;
  const ratioMinimum = configDefaults.transactionFeeRatioMinimum;

  const ratio = totalFeeRatio * precision;
  if (ratio < ratioMinimum) {
    throw new Error(
      `Price ratio between token (${tokenPrice.price}) and gas token (${gasTokenPrice.price})
      is not precise enough to provide an accurate fee.`,
    );
  }

  const roundedRatio = BigNumber.from(Math.round(ratio));
  const decimalDifference = networkGasToken.decimals - tokenConfig.decimals;
  const decimalRatio = BigNumber.from(10).pow(
    BigNumber.from(decimalDifference),
  );

  const maximumGasFeeForToken = maximumGas
    .mul(roundedRatio)
    .div(decimalRatio)
    .div(BigNumber.from(precision));

  cacheFeeForTransaction(
    serializedTransaction,
    tokenAddress,
    maximumGasFeeForToken,
  );

  return BigNumber.from(maximumGasFeeForToken);
};
