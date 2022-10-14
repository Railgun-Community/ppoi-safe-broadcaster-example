import { ViewingKeyPair } from '@railgun-community/engine/dist/key-derivation/wallet-node';
import { OutputType } from '@railgun-community/engine/dist/models/formatted-types';
import { Note } from '@railgun-community/engine/dist/note/note';
import { Prover } from '@railgun-community/engine/dist/prover/prover';
import {
  ByteLength,
  formatToByteLength,
} from '@railgun-community/engine/dist/utils/bytes';
import { getPublicViewingKey } from '@railgun-community/engine/dist/utils/keys-utils';
import { AbstractWallet } from '@railgun-community/engine/dist/wallet/abstract-wallet';
import { RailgunWallet } from '@railgun-community/engine/dist/wallet/railgun-wallet';
import { randomBytes } from 'ethers/lib/utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';
import { getRailgunAddressData } from '../../server/wallets/active-wallets';

let balancesStub: SinonStub;
let treeBalancesStub: SinonStub;
let verifyProofStub: SinonStub;

const getMockBalanceData = async (tokenAddress: string, tree: number) => {
  const addressData = getRailgunAddressData();
  const privateViewingKey = randomBytes(32);
  const publicViewingKey = await getPublicViewingKey(privateViewingKey);
  const senderViewingKeys: ViewingKeyPair = {
    privateKey: privateViewingKey,
    pubkey: publicViewingKey,
  };

  return {
    balance: BigInt('1000000000000000000000'),
    utxos: [
      {
        tree,
        position: 0,
        txid: '123',
        spendtxid: '123',
        note: Note.create(
          addressData,
          '12345678901234561234567890123456',
          '1000000000000000000000',
          tokenAddress,
          senderViewingKeys,
          undefined, // senderBlindingKey
          OutputType.Transfer,
          undefined, // memoText
        ),
      },
    ],
  };
};

export const createEngineWalletBalancesStub = async (
  tokenAddress: string,
  tree: number,
) => {
  balancesStub = sinon
    .stub(RailgunWallet.prototype, 'balances')
    .resolves({ [tokenAddress]: await getMockBalanceData(tokenAddress, tree) });
};

export const createAbstractWalletBalancesStub = async (
  tokenAddress: string,
  tree: number,
) => {
  balancesStub = sinon
    .stub(AbstractWallet.prototype, 'balances')
    .resolves({ [tokenAddress]: await getMockBalanceData(tokenAddress, tree) });
};
 


export const createEngineWalletTreeBalancesStub = async (
  tokenAddress: string,
  tree: number,
) => {
  const formattedTokenAddress = formatToByteLength(
    tokenAddress.replace('0x', ''),
    ByteLength.UINT_256,
  );
  treeBalancesStub = sinon
    .stub(RailgunWallet.prototype, 'balancesByTree')
    .resolves({
      [formattedTokenAddress]: [await getMockBalanceData(tokenAddress, tree)],
    });
};

export const createEngineVerifyProofStub = () => {
  verifyProofStub = sinon.stub(Prover.prototype, 'verify').resolves(true);
};

export const restoreEngineStubs = () => {
  balancesStub?.restore();
  treeBalancesStub?.restore();
  verifyProofStub?.restore();
};
