import { Note } from '@railgun-community/lepton';
import { Prover } from '@railgun-community/lepton/dist/prover';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';
import { getRailgunAddressData } from '../../server/wallets/active-wallets';

let balancesStub: SinonStub;
let verifyProofStub: SinonStub;

export const createLeptonWalletBalancesStub = (
  tokenAddressHexlify: string,
  tree: number,
) => {
  const addressData = getRailgunAddressData();
  balancesStub = sinon.stub(RailgunWallet.prototype, 'balances').resolves({
    [tokenAddressHexlify]: {
      balance: BigInt('1000000000000000000000'),
      utxos: [
        {
          tree,
          position: 0,
          txid: '123',
          spendtxid: '123',
          note: new Note(
            addressData,
            '123',
            '1000000000000000000000',
            tokenAddressHexlify,
          ),
        },
      ],
    },
  });
};

export const createLeptonVerifyProofStub = () => {
  verifyProofStub = sinon.stub(Prover.prototype, 'verify').resolves(true);
};

export const restoreLeptonStubs = () => {
  balancesStub?.restore();
  verifyProofStub?.restore();
};
