import { Note } from '@railgun-community/lepton';
import { Prover } from '@railgun-community/lepton/dist/prover';
import {
  ByteLength,
  formatToByteLength,
} from '@railgun-community/lepton/dist/utils/bytes';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';
import { getRailgunAddressData } from '../../server/wallets/active-wallets';

let balancesStub: SinonStub;
let treeBalancesStub: SinonStub;
let verifyProofStub: SinonStub;

const getBalanceData = (tokenAddress: string, tree: number) => {
  const addressData = getRailgunAddressData();

  return {
    balance: BigInt('1000000000000000000000'),
    utxos: [
      {
        tree,
        position: 0,
        txid: '123',
        spendtxid: '123',
        note: new Note(
          addressData,
          '12345678901234561234567890123456',
          '1000000000000000000000',
          tokenAddress,
          [],
        ),
      },
    ],
  };
};

export const createLeptonWalletBalancesStub = (
  tokenAddress: string,
  tree: number,
) => {
  balancesStub = sinon
    .stub(RailgunWallet.prototype, 'balances')
    .resolves({ [tokenAddress]: getBalanceData(tokenAddress, tree) });
};

export const createLeptonWalletTreeBalancesStub = (
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
      [formattedTokenAddress]: [getBalanceData(tokenAddress, tree)],
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
