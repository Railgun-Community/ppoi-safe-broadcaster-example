import {
  ByteLength,
  formatToByteLength,
  nToBytes,
  nToHex,
  trim,
} from '@railgun-community/lepton/dist/utils/bytes';
import { BigNumber, Contract } from 'ethers';
import { Note } from '@railgun-community/lepton';
import { getSharedSymmetricKey } from '@railgun-community/lepton/dist/utils/keys-utils';
import { Ciphertext } from '@railgun-community/lepton/dist/models/transaction-types';
import { TransactionRequest } from '@ethersproject/providers';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';
import { abiForProxyContract } from '../abi/abi';
import { getProviderForNetwork } from '../providers/active-network-providers';
import {
  getRailgunAddressData,
  getRailgunWallet,
} from '../wallets/active-wallets';

const parseFormattedTokenAddress = (formattedTokenAddress: string) => {
  return `0x${trim(formattedTokenAddress, 20)}`;
};

type PackagedFee = {
  tokenAddress: string;
  packagedFeeAmount: BigNumber;
};

type CommitmentCiphertext = {
  ciphertext: BigNumber[];
  ephemeralKeys: BigNumber[];
  memo: BigNumber;
};

type BoundParams = {
  // uint16 treeNumber;
  // WithdrawType withdraw;
  // address adaptContract;
  // bytes32 adaptParams;
  commitmentCiphertext: CommitmentCiphertext[];
};

type TransactionData = {
  // SnarkProof proof;
  // uint256 merkleRoot;
  // uint256[] nullifiers;
  commitments: BigNumber[];
  boundParams: BoundParams;
  // CommitmentPreimage withdrawPreimage;
  // address overrideOutput;
};

export const extractPackagedFeeFromTransaction = async (
  chainID: NetworkChainID,
  transactionRequest: TransactionRequest,
): Promise<PackagedFee> => {
  const network = configNetworks[chainID];
  if (
    !transactionRequest.to ||
    transactionRequest.to.toLowerCase() !== network.proxyContract.toLowerCase()
  ) {
    throw new Error(
      `Invalid contract address: got ${transactionRequest.to}, expected ${network.proxyContract} for chain ${chainID}`,
    );
  }

  const provider = getProviderForNetwork(chainID);
  const abi = abiForProxyContract();
  const contract = new Contract(network.proxyContract, abi, provider);

  const parsedTransaction = contract.interface.parseTransaction({
    data: (transactionRequest.data as string) ?? '',
    value: transactionRequest.value,
  });
  if (parsedTransaction.name !== 'transact') {
    throw new Error('Contract method invalid');
  }

  const viewingKeys = getRailgunWallet().getViewingKeyPair();
  const viewingPrivateKey = viewingKeys.privateKey;
  const { masterPublicKey } = getRailgunAddressData();

  const tokenPaymentAmounts: MapType<BigNumber> = {};

  // eslint-disable-next-line no-underscore-dangle
  const railgunTxs = parsedTransaction.args._transactions as any;

  await Promise.all(
    railgunTxs.map((railgunTx: any) =>
      extractFeesFromRailgunTransactions(
        railgunTx,
        tokenPaymentAmounts,
        viewingPrivateKey,
        masterPublicKey,
      ),
    ),
  );

  const tokens = Object.keys(tokenPaymentAmounts);
  if (tokens.length < 1) {
    throw new Error('No Relayer payment included in transaction.');
  }

  // Return first payment.
  return {
    tokenAddress: parseFormattedTokenAddress(tokens[0].toLowerCase()),
    packagedFeeAmount: tokenPaymentAmounts[tokens[0]],
  };
};

const getSharedKeySafe = (
  viewingPrivateKey: Uint8Array,
  ephemeralKey: Uint8Array,
) => {
  try {
    return getSharedSymmetricKey(viewingPrivateKey, ephemeralKey);
  } catch (err) {
    return null;
  }
};

const decryptNoteSafe = (encryptedNote: Ciphertext, sharedKey: Uint8Array) => {
  try {
    return Note.decrypt(encryptedNote, sharedKey);
  } catch (err) {
    return null;
  }
};

const extractFeesFromRailgunTransactions = async (
  railgunTx: TransactionData,
  tokenPaymentAmounts: MapType<BigNumber>,
  viewingPrivateKey: Uint8Array,
  masterPublicKey: bigint,
) => {
  const { commitments } = railgunTx;

  // First commitment should always be the fee.
  const index = 0;
  const hash = commitments[index];
  const ciphertext = railgunTx.boundParams.commitmentCiphertext[index];

  const ephemeralKeyBytes = nToBytes(
    BigInt(ciphertext.ephemeralKeys[0].toHexString()),
    ByteLength.UINT_256,
  );

  const sharedKey = await getSharedKeySafe(
    viewingPrivateKey,
    ephemeralKeyBytes,
  );
  if (sharedKey == null) {
    // Not addressed to us.
    return;
  }

  const ciphertextHexlified = ciphertext.ciphertext.map((el) =>
    formatToByteLength(el.toHexString(), ByteLength.UINT_256),
  );
  const ivTag = ciphertextHexlified[0];
  const encryptedNote: Ciphertext = {
    iv: ivTag.substring(0, 32),
    tag: ivTag.substring(32),
    data: ciphertextHexlified.slice(1),
  };
  const decryptedNote = decryptNoteSafe(encryptedNote, sharedKey);
  if (decryptedNote == null) {
    // Addressed to us, but different note than fee.
    return;
  }

  if (decryptedNote.masterPublicKey === masterPublicKey) {
    const noteHash = nToHex(decryptedNote.hash, ByteLength.UINT_256);
    const commitHash = formatToByteLength(
      hash.toHexString(),
      ByteLength.UINT_256,
    );
    if (noteHash !== commitHash) {
      throw new Error(
        `Client attempted to steal from relayer via invalid ciphertext: Note hash mismatch ${noteHash} vs ${commitHash}.`,
      );
    }

    if (!tokenPaymentAmounts[decryptedNote.token]) {
      // eslint-disable-next-line no-param-reassign
      tokenPaymentAmounts[decryptedNote.token] = BigNumber.from(0);
    }
    // eslint-disable-next-line no-param-reassign
    tokenPaymentAmounts[decryptedNote.token] = tokenPaymentAmounts[
      decryptedNote.token
    ].add(decryptedNote.value.toString());
  }
};
