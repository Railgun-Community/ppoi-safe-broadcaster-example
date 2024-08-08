import {
  EVMGasType,
  PreTransactionPOIsPerTxidLeafPerList,
  TXIDVersion,
  getEVMGasTypeForTransaction,
  networkForChain,
} from '@railgun-community/shared-models';
import debug from 'debug';
import { BroadcasterChain } from '../../models/chain-models';
import { ErrorMessage } from '../../util/errors';
import { validateFee } from '../fees/fee-validator';
import {
  calculateMaximumGasBroadcaster,
  getEstimateGasDetailsRelayed,
} from '../fees/gas-estimate';
import { validateMinGasPrice } from '../fees/gas-price-validator';
import { minimumGasBalanceForAvailability } from '../wallets/available-wallets';
import { getBestMatchWalletForNetwork } from '../wallets/best-match-wallet';
import { executeTransaction } from './execute-transaction';
import { extractPackagedFeeFromTransaction } from './extract-packaged-fee';
import { ContractTransaction, TransactionResponse } from 'ethers';
import { ValidatedPOIData, validatePOI } from './poi-validator';
import {
  ReliabilityMetric,
  incrementReliability,
} from '../../util/reliability';

const dbg = debug('broadcaster:transact:validate');

export const processTransaction = async (
  txidVersion: TXIDVersion,
  chain: BroadcasterChain,
  feeCacheID: string,
  minGasPrice: bigint,
  transaction: ContractTransaction,
  useRelayAdapt: boolean,
  preTransactionPOIsPerTxidLeafPerList: PreTransactionPOIsPerTxidLeafPerList,
  devLog?: boolean,
): Promise<TransactionResponse> => {
  // Minimum gas for gas estimate wallet: 0.15 (or 0.01 L2).
  const minimumGasNeeded = minimumGasBalanceForAvailability(chain);

  const walletForGasEstimate = await getBestMatchWalletForNetwork(
    chain,
    minimumGasNeeded,
  );

  const network = networkForChain(chain);
  if (!network) {
    throw new Error(ErrorMessage.UNSUPPORTED_NETWORK);
  }

  const sendWithPublicWallet = false;
  const evmGasType = getEVMGasTypeForTransaction(
    network.name,
    sendWithPublicWallet,
  );
  if (evmGasType === EVMGasType.Type2) {
    throw new Error('Invalid gas type for Broadcaster transaction.');
  }

  const transactionRequestForGasEstimate: ContractTransaction = {
    ...transaction,
    from: walletForGasEstimate.address,
  };

  dbg('minGasPrice:', minGasPrice);

  const transactionGasDetails = await getEstimateGasDetailsRelayed(
    chain,
    evmGasType,
    minGasPrice,
    transactionRequestForGasEstimate,
    devLog,
  ).catch(async (e) => {
    dbg('Error getting gas estimate:', e);
    await incrementReliability(chain, ReliabilityMetric.GAS_ESTIMATE_FAILURE);
    throw e;
  });

  dbg('transactionGasDetails:', transactionGasDetails);

  const maximumGas = calculateMaximumGasBroadcaster(
    transactionGasDetails,
    chain,
  );
  dbg('Maximum gas:', maximumGas);

  const { tokenAddress, packagedFeeAmount } =
    await extractPackagedFeeFromTransaction(
      txidVersion,
      chain,
      transaction,
      useRelayAdapt,
    );
  try {
    validateFee(chain, tokenAddress, maximumGas, feeCacheID, packagedFeeAmount);
  } catch (error) {
    await incrementReliability(chain, ReliabilityMetric.GAS_ESTIMATE_FAILURE);
    throw error;
  }
  await incrementReliability(chain, ReliabilityMetric.GAS_ESTIMATE_SUCCESS);

  dbg('Fee validated:', packagedFeeAmount, tokenAddress);
  dbg('Transaction gas details:', transactionGasDetails);

  await validateMinGasPrice(chain, minGasPrice, evmGasType).catch(async (e) => {
    dbg('Error validating min gas price:', e);
    await incrementReliability(chain, ReliabilityMetric.FEE_VALIDATION_FAILURE);
    throw e;
  });
  await incrementReliability(chain, ReliabilityMetric.FEE_VALIDATION_SUCCESS);

  // DO NOT MODIFY.
  // WARNING: If you modify POI validation, you risk fees that aren't spendable, as they won't have valid POIs.
  const validatedPOIData: Optional<ValidatedPOIData> = await validatePOI(
    txidVersion,
    chain,
    transaction,
    useRelayAdapt,
    preTransactionPOIsPerTxidLeafPerList,
    // DO NOT MODIFY.
  );

  return executeTransaction(
    chain,
    transaction,
    transactionGasDetails,
    txidVersion,
    validatedPOIData,
  );
};
