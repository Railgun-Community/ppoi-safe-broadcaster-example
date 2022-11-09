import {
  ByteLength,
  formatToByteLength,
  nToHex,
  trim,
  getSharedSymmetricKey,
  Ciphertext,
  TransactNote,
  hexStringToBytes,
  formatCommitmentCiphertext,
} from '@railgun-community/engine';
import { BigNumber, Contract } from 'ethers';
import { TransactionRequest } from '@ethersproject/providers';
import configNetworks from '../config/config-networks';
import { abiForProxyContract, abiForRelayAdaptContract } from '../abi/abi';
import { getProviderForNetwork } from '../providers/active-network-providers';
import {
  getRailgunAddressData,
  getRailgunWallet,
} from '../wallets/active-wallets';
import { RelayerChain } from '../../models/chain-models';
import { CommitmentCiphertextStructOutput } from '@railgun-community/engine/dist/typechain-types/contracts/logic/RailgunLogic';
import debug from 'debug';

const dbg = debug('relayer:transact:extract-packaged-fee');

const parseFormattedTokenAddress = (formattedTokenAddress: string) => {
  return `0x${trim(formattedTokenAddress, 20)}`;
};

type PackagedFee = {
  tokenAddress: string;
  packagedFeeAmount: BigNumber;
};

type CommitmentCiphertext = {
  ciphertext: Ciphertext;
  blindedSenderViewingKey: string;
  blindedReceiverViewingKey: string;
  annotationData: string;
  memo: string;
};

type BoundParams = {
  // ...
  commitmentCiphertext: CommitmentCiphertextStructOutput[];
};

type TransactionData = {
  // SnarkProof proof;
  // uint256 merkleRoot;
  // uint256[] nullifiers;
  commitments: string[];
  boundParams: BoundParams;
  // CommitmentPreimage withdrawPreimage;
  // address overrideOutput;
};

enum TransactionName {
  Proxy = 'transact',
  RelayAdapt = 'relay',
}

export const extractPackagedFeeFromTransaction = (
  chain: RelayerChain,
  transactionRequest: TransactionRequest,
  useRelayAdapt: boolean,
): Promise<PackagedFee> => {
  if (useRelayAdapt) {
    return extractPackagedFeeFromRelayAdaptTransaction(
      chain,
      transactionRequest,
    );
  }

  return extractPackagedFeeFromProxyTransaction(chain, transactionRequest);
};

const extractPackagedFeeFromProxyTransaction = (
  chain: RelayerChain,
  transactionRequest: TransactionRequest,
): Promise<PackagedFee> => {
  const network = configNetworks[chain.type][chain.id];
  return extractPackagedFee(
    chain,
    transactionRequest,
    TransactionName.Proxy,
    network.proxyContract,
    abiForProxyContract(),
  );
};

const extractPackagedFeeFromRelayAdaptTransaction = (
  chain: RelayerChain,
  transactionRequest: TransactionRequest,
): Promise<PackagedFee> => {
  const network = configNetworks[chain.type][chain.id];
  return extractPackagedFee(
    chain,
    transactionRequest,
    TransactionName.RelayAdapt,
    network.relayAdaptContract,
    abiForRelayAdaptContract(),
  );
};

const extractPackagedFee = async (
  chain: RelayerChain,
  transactionRequest: TransactionRequest,
  transactionName: TransactionName,
  contractAddress: string,
  abi: Array<any>,
): Promise<PackagedFee> => {
  if (
    !transactionRequest.to ||
    transactionRequest.to.toLowerCase() !== contractAddress.toLowerCase()
  ) {
    throw new Error(
      `Invalid contract address: got ${transactionRequest.to}, expected ${contractAddress} for chain ${chain}`,
    );
  }

  const provider = getProviderForNetwork(chain);
  const contract = new Contract(contractAddress, abi, provider);

  const parsedTransaction = contract.interface.parseTransaction({
    data: (transactionRequest.data as string) ?? '',
    value: transactionRequest.value,
  });
  if (parsedTransaction.name !== transactionName) {
    throw new Error(`Contract method invalid: expected ${transactionName}`);
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
    throw new Error('No Relayer Fee included in transaction.');
  }

  // Return first payment.
  return {
    tokenAddress: parseFormattedTokenAddress(tokens[0].toLowerCase()),
    packagedFeeAmount: tokenPaymentAmounts[tokens[0]],
  };
};

const decryptReceiverNoteSafe = async (
  commitmentCiphertext: CommitmentCiphertext,
  viewingPrivateKey: Uint8Array,
) => {
  try {
    const blindedSenderViewingKey = hexStringToBytes(
      commitmentCiphertext.blindedSenderViewingKey,
    );
    const blindedReceiverViewingKey = hexStringToBytes(
      commitmentCiphertext.blindedReceiverViewingKey,
    );
    const sharedKey = await getSharedSymmetricKey(
      viewingPrivateKey,
      blindedSenderViewingKey,
    );
    if (!sharedKey) {
      dbg('invalid sharedKey');
      return null;
    }
    return TransactNote.decrypt(
      getRailgunAddressData(),
      commitmentCiphertext.ciphertext,
      sharedKey,
      commitmentCiphertext.memo,
      commitmentCiphertext.annotationData,
      blindedReceiverViewingKey, // blindedReceiverViewingKey
      blindedSenderViewingKey, // blindedSenderViewingKey
      undefined, // senderRandom - not used
      false, // isSentNote
      false, // isLegacyDecryption
    );
  } catch (err) {
    dbg('Decryption error', err.message);
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
  const hash: string = commitments[index];
  const ciphertext = railgunTx.boundParams.commitmentCiphertext[index];

  const decryptedReceiverNote = await decryptReceiverNoteSafe(
    formatCommitmentCiphertext(ciphertext),
    viewingPrivateKey,
  );
  if (decryptedReceiverNote == null) {
    // Addressed to us, but different note than fee.
    dbg('invalid decryptedReceiverNote');
    return;
  }

  if (
    decryptedReceiverNote.receiverAddressData.masterPublicKey !==
    masterPublicKey
  ) {
    dbg('invalid masterPublicKey');
    return;
  }

  const noteHash = nToHex(decryptedReceiverNote.hash, ByteLength.UINT_256);
  const commitHash = formatToByteLength(hash, ByteLength.UINT_256);
  if (noteHash !== commitHash) {
    dbg('invalid commitHash');
    return;
  }

  if (!tokenPaymentAmounts[decryptedReceiverNote.token]) {
    // eslint-disable-next-line no-param-reassign
    tokenPaymentAmounts[decryptedReceiverNote.token] = BigNumber.from(0);
  }
  // eslint-disable-next-line no-param-reassign
  tokenPaymentAmounts[decryptedReceiverNote.token] = tokenPaymentAmounts[
    decryptedReceiverNote.token
  ].add(decryptedReceiverNote.value.toString());
};
