import { BigNumber } from '@ethersproject/bignumber';
import { validateFee } from '../fees/fee-validator';
import { RelayerChain } from '../../models/chain-models';
import {
  RelayerPreAuthorization,
  RelayerSignedPreAuthorization,
  networkForChain,
} from '@railgun-community/shared-models';
import {
  getRailgunWalletAddressData,
  walletForID,
  CommitmentCiphertext,
  extractERC20AmountFromCommitmentCiphertext,
} from '@railgun-community/quickstart';
import { getRailgunWalletID } from '../wallets/active-wallets';
import configDefaults from '../config/config-defaults';
import { maxBigNumber } from '../../util/utils';
import { parseUnits } from '@ethersproject/units';
import configNetworks from '../config/config-networks';
import { PaymasterWallet } from '../wallets/paymaster-wallet';
import { ErrorMessage } from '../../util/errors';

export const preAuthorizeRequest = async (
  chain: RelayerChain,
  feeCacheID: string,
  commitmentCiphertext: CommitmentCiphertext,
  commitmentHash: string,
  gasLimit: string,
): Promise<RelayerSignedPreAuthorization> => {
  const network = networkForChain(chain);
  if (!network) {
    throw new Error(`No network for chain ${chain.type}:${chain.id}`);
  }

  const railgunWalletID = getRailgunWalletID();
  const railgunWallet = walletForID(railgunWalletID);
  const railgunWalletAddress = railgunWallet.getAddress();
  const receivingViewingPrivateKey = railgunWallet.viewingKeyPair.privateKey;
  const receivingRailgunAddressData =
    getRailgunWalletAddressData(railgunWalletAddress);

  const feeERC20Amount = await extractERC20AmountFromCommitmentCiphertext(
    network,
    commitmentCiphertext,
    commitmentHash,
    receivingViewingPrivateKey,
    receivingRailgunAddressData,
  );
  if (!feeERC20Amount) {
    throw new Error(ErrorMessage.NO_RELAYER_FEE);
  }

  const packagedFee = BigNumber.from(feeERC20Amount.amountString);
  const maximumGas = BigNumber.from(gasLimit);

  // Throws if fee is invalid.
  validateFee(
    chain,
    feeERC20Amount.tokenAddress,
    maximumGas,
    feeCacheID,
    packagedFee,
  );

  const minimumGasNeeded = maxBigNumber(
    BigNumber.from(gasLimit),
    minimumPaymasterGasBalanceForAvailability(chain),
  );

  const hasEnoughGas = await PaymasterWallet.hasEnoughPaymasterGas(
    chain,
    minimumGasNeeded,
  );
  if (!hasEnoughGas) {
    throw new Error(ErrorMessage.NOT_ENOUGH_PAYMASTER_GAS);
  }

  const expirationMS = configDefaults.paymaster.preAuthorizationExpirationInMS;
  const expiration = Date.now() + expirationMS;

  const preAuthorization: RelayerPreAuthorization = {
    gasLimit,
    commitmentHash,
    expiration,
  };

  const signature = await PaymasterWallet.signPaymasterPreAuthorize(
    chain,
    preAuthorization,
  );

  const signedPreAuthorization = {
    ...preAuthorization,
    signature,
  };

  return signedPreAuthorization;
};

const minimumPaymasterGasBalanceForAvailability = (
  chain: RelayerChain,
): BigNumber => {
  const { gasToken } = configNetworks[chain.type][chain.id];
  const { minBalanceForAvailability } = configDefaults.paymaster;
  return parseUnits(String(minBalanceForAvailability), gasToken.decimals);
};
