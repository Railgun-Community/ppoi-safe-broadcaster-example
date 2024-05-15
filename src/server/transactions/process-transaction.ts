import {
  EVMGasType,
  PreTransactionPOIsPerTxidLeafPerList,
  TXIDVersion,
  getEVMGasTypeForTransaction,
  networkForChain,
} from '@railgun-community/shared-models';
import debug from 'debug';
import { RelayerChain } from '../../models/chain-models';
import { ErrorMessage } from '../../util/errors';
import { validateFee } from '../fees/fee-validator';
import {
  calculateMaximumGasRelayer,
  getEstimateGasDetailsRelayed,
} from '../fees/gas-estimate';
import { validateMinGasPrice } from '../fees/gas-price-validator';
import { minimumGasBalanceForAvailability } from '../wallets/available-wallets';
import { getBestMatchWalletForNetwork } from '../wallets/best-match-wallet';
import { executeTransaction } from './execute-transaction';
import { extractPackagedFeeFromTransaction } from './extract-packaged-fee';
import { ContractTransaction, TransactionResponse } from 'ethers';
import { ValidatedPOIData, validatePOI } from './poi-validator';

const dbg = debug('broadcaster:transact:validate');

export const processTransaction = async (
  txidVersion: TXIDVersion,
  chain: RelayerChain,
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
  );

  dbg('transactionGasDetails:', transactionGasDetails);

  const maximumGas = calculateMaximumGasRelayer(transactionGasDetails, chain);
  dbg('Maximum gas:', maximumGas);

  const { tokenAddress, packagedFeeAmount } =
    await extractPackagedFeeFromTransaction(
      txidVersion,
      chain,
      transaction,
      useRelayAdapt,
    );
  validateFee(chain, tokenAddress, maximumGas, feeCacheID, packagedFeeAmount);
  dbg('Fee validated:', packagedFeeAmount, tokenAddress);
  dbg('Transaction gas details:', transactionGasDetails);

  await validateMinGasPrice(chain, minGasPrice, evmGasType);

  // DO NOT MODIFY.
  // WARNING: If you modify POI validation, you risk fees that aren't spendable, as they won't have valid POIs.
  const validatedPOIData: Optional<ValidatedPOIData> = await validatePOI(
    txidVersion,
    chain,
    transaction,
    useRelayAdapt,
    preTransactionPOIsPerTxidLeafPerList,
  );
  // DO NOT MODIFY.

  return executeTransaction(
    chain,
    transaction,
    transactionGasDetails,
    txidVersion,
    validatedPOIData,
  );
};
