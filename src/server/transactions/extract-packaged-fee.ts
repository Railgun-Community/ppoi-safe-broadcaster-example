import { bytes } from '@railgun-community/lepton/dist/utils';
import {
  hexStringToBytes,
  trim,
} from '@railgun-community/lepton/dist/utils/bytes';
import { BigNumber, Contract, PopulatedTransaction } from 'ethers';
import { Note } from '@railgun-community/lepton';
import { getSharedSymmetricKey } from '@railgun-community/lepton/dist/utils/keys-utils';
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

export const extractPackagedFeeFromTransaction = (
  chainID: NetworkChainID,
  populatedTransaction: PopulatedTransaction,
): PackagedFee => {
  const network = configNetworks[chainID];
  if (populatedTransaction.to !== network.proxyContract) {
    throw new Error('Invalid contract address.');
  }

  const provider = getProviderForNetwork(chainID);
  const abi = abiForProxyContract();
  const contract = new Contract(network.proxyContract, abi, provider);

  const parsedTransaction = contract.interface.parseTransaction({
    data: populatedTransaction.data ?? '',
    value: populatedTransaction.value,
  });
  if (parsedTransaction.name !== 'transact') {
    throw new Error('Contract method invalid');
  }

  const viewingKeys = getRailgunWallet().getViewingKeyPair();
  const viewingPrivateKey = viewingKeys.privateKey;
  const { masterPublicKey } = getRailgunAddressData();

  const tokenPaymentAmounts: MapType<BigNumber> = {};

  // TODO: Fix the any's with a real type from Lepton.
  // eslint-disable-next-line no-underscore-dangle
  const railgunTxs = parsedTransaction.args._transactions as any;

  railgunTxs.forEach((railgunTx: any) =>
    extractFeesFromRailgunTransactions(
      railgunTx,
      tokenPaymentAmounts,
      viewingPrivateKey,
      masterPublicKey,
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

const extractFeesFromRailgunTransactions = async (
  railgunTx: TransactionData,
  tokenPaymentAmounts: MapType<BigNumber>,
  viewingPrivateKey: Uint8Array,
  masterPublicKey: bigint,
) => {
  const { commitments } = railgunTx;

  await Promise.all(
    commitments.map(async (commitment, index) => {
      const hash = commitment;
      const ciphertext = railgunTx.boundParams.commitmentCiphertext[index];

      const sharedKey = await getSharedSymmetricKey(
        viewingPrivateKey,
        hexStringToBytes(ciphertext.ephemeralKeys[0].toHexString()),
      );

      const ciphertextHexlified = ciphertext.ciphertext.map((el) =>
        el.toHexString(),
      );
      const ivTag = ciphertextHexlified[0];
      const decryptedNote = Note.decrypt(
        {
          iv: ivTag.substring(0, 16),
          tag: ivTag.substring(16),
          data: ciphertextHexlified.slice(1),
        },
        sharedKey,
      );

      if (decryptedNote.masterPublicKey === masterPublicKey) {
        if (`0x${decryptedNote.hash}` !== hash.toHexString()) {
          throw new Error(
            'Client attempted to steal from relayer via invalid ciphertext.',
          );
        }

        if (!tokenPaymentAmounts[decryptedNote.token]) {
          // eslint-disable-next-line no-param-reassign
          tokenPaymentAmounts[decryptedNote.token] = BigNumber.from(0);
        }
        // eslint-disable-next-line no-param-reassign
        tokenPaymentAmounts[decryptedNote.token] = tokenPaymentAmounts[
          decryptedNote.token
        ].add(BigNumber.from(decryptedNote.value).toString());
      }
    }),
  );
};
