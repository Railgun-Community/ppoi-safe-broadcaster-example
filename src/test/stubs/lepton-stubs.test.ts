import { ERC20Note } from '@railgun-community/lepton';
import { Prover } from '@railgun-community/lepton/dist/prover';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
// eslint-disable-next-line import/no-extraneous-dependencies
import BN from 'bn.js';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';

let balancesStub: SinonStub;
let verifyProofStub: SinonStub;

export const createLeptonWalletBalancesStub = (
  tokenAddressHexlify: string,
  tree: number,
) => {
  balancesStub = sinon.stub(RailgunWallet.prototype, 'balances').resolves({
    [tokenAddressHexlify]: {
      balance: new BN('1000000000000000000000'),
      utxos: [
        {
          tree,
          position: 0,
          index: 0,
          change: false,
          txid: '123',
          spendtxid: '123',
          note: new ERC20Note(
            '123',
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
