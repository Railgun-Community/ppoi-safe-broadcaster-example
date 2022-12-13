import {
  ViewingKeyPair,
  OutputType,
  TransactNote,
  Prover,
  formatToByteLength,
  getPublicViewingKey,
  AbstractWallet,
  RailgunWallet,
  ByteLength,
  getTokenDataERC20,
  TreeBalance,
} from '@railgun-community/engine';
import { randomBytes } from 'ethers/lib/utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';
import { getRailgunAddressData } from '../../server/wallets/active-wallets';

let balancesStub: SinonStub;
let treeBalancesStub: SinonStub;
let verifyProofStub: SinonStub;

const getMockBalanceData = async (
  tokenAddress: string,
  tree: number,
): Promise<TreeBalance> => {
  const addressData = getRailgunAddressData();
  const privateViewingKey = randomBytes(32);
  const publicViewingKey = await getPublicViewingKey(privateViewingKey);
  const senderViewingKeys: ViewingKeyPair = {
    privateKey: privateViewingKey,
    pubkey: publicViewingKey,
  };
  const tokenData = getTokenDataERC20(tokenAddress);

  return {
    balance: BigInt('1000000000000000000000'),
    tokenData,
    utxos: [
      {
        tree,
        position: 0,
        txid: '123',
        spendtxid: '123',
        note: TransactNote.createTransfer(
          addressData, // receiver
          addressData, // sender
          '12345678901234561234567890123456', // random
          1000000000000000000000n, // value
          tokenData, // tokenData
          senderViewingKeys,
          false, // shouldShowSender
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
