import { ERC20Note } from '@railgun-community/lepton';
import { babyjubjub } from '@railgun-community/lepton/dist/utils';
import { hexlify } from '@railgun-community/lepton/dist/utils/bytes';
import { BigNumber, Contract, PopulatedTransaction } from 'ethers';
import { NetworkChainID } from '../config/config-chain-ids';
import configNetworks from '../config/config-networks';
import { abiForProxyContract } from '../abi/abi';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getRailgunWalletKeypair } from '../wallets/active-wallets';
import { bytes } from '@railgun-community/lepton/dist/utils';

const parseFormattedTokenAddress = (formattedTokenAddress: string) => {
  return '0x' + bytes.trim(formattedTokenAddress, 20);
};

type PackagedFee = {
  tokenAddress: string;
  packagedFeeAmount: BigNumber;
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

  const keypair = getRailgunWalletKeypair(chainID);
  const walletPrivateKey = keypair.privateKey;
  const walletPublicKey = keypair.pubkey;

  const tokenPaymentAmounts: MapType<BigNumber> = {};

  // TODO: Fix the any's with a real type.
  const railgunTxs = parsedTransaction.args['_transactions'] as any;

  railgunTxs.forEach((railgunTx: any) =>
    extractFeesFromRailgunTransactions(
      railgunTx,
      tokenPaymentAmounts,
      walletPrivateKey,
      walletPublicKey,
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

const extractFeesFromRailgunTransactions = (
  railgunTx: any,
  tokenPaymentAmounts: MapType<BigNumber>,
  walletPrivateKey: string,
  walletPublicKey: string,
) => {
  // TODO: Confirm these types. (Build into Lepton).
  const commitmentsOut = railgunTx['commitmentsOut'] as {
    hash: BigNumber;
    ciphertext: BigNumber[];
    senderPubKey: BigNumber[];
    revealKey: BigNumber[];
  }[];

  commitmentsOut.forEach((commitment) => {
    const sharedKey = babyjubjub.ecdh(
      hexlify(walletPrivateKey),
      babyjubjub.packPoint(
        commitment.senderPubKey.map((el) => el.toHexString()),
      ),
    );

    const ciphertexthexlified = commitment.ciphertext.map((el) =>
      el.toHexString(),
    );
    const decryptedNote = ERC20Note.decrypt(
      {
        iv: ciphertexthexlified[0],
        data: ciphertexthexlified.slice(1),
      },
      sharedKey,
    );

    if (decryptedNote.pubkey === walletPublicKey) {
      if (`0x${decryptedNote.hash}` !== commitment.hash.toHexString())
        throw new Error(
          'Client attempted to steal from relayer via invalid ciphertext.',
        );

      if (!tokenPaymentAmounts[decryptedNote.token]) {
        tokenPaymentAmounts[decryptedNote.token] = BigNumber.from(0);
      }
      tokenPaymentAmounts[decryptedNote.token] = tokenPaymentAmounts[
        decryptedNote.token
      ].add(BigNumber.from(decryptedNote.amount));
    }
  });
};
