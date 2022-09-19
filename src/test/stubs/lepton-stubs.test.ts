import { Note } from '@railgun-community/lepton';
import { ViewingKeyPair } from '@railgun-community/lepton/dist/keyderivation/wallet-node';
import { OutputType } from '@railgun-community/lepton/dist/models/formatted-types';
import { Prover } from '@railgun-community/lepton/dist/prover';
import {
  ByteLength,
  formatToByteLength,
} from '@railgun-community/lepton/dist/utils/bytes';
import { getPublicViewingKey } from '@railgun-community/lepton/dist/utils/keys-utils';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet/wallet';
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

export const createLeptonWalletBalancesStub = async (
  tokenAddress: string,
  tree: number,
) => {
  balancesStub = sinon
    .stub(RailgunWallet.prototype, 'balances')
    .resolves({ [tokenAddress]: await getMockBalanceData(tokenAddress, tree) });
};

export const createLeptonWalletTreeBalancesStub = async (
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

export const createLeptonVerifyProofStub = () => {
  verifyProofStub = sinon.stub(Prover.prototype, 'verify').resolves(true);
};

export const restoreLeptonStubs = () => {
  balancesStub?.restore();
  treeBalancesStub?.restore();
  verifyProofStub?.restore();
};
