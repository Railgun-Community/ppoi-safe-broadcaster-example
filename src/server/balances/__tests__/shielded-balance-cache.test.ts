import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../config/config-chains';
import {
  getPrivateTokenBalanceCache,
  parseRailBalanceAddress,
  ShieldedCachedBalance,
} from '../shielded-balance-cache';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { throwErr } from '../../../util/promise-utils';
import { TokenAmount } from '../../../models/token-models';
import { BigNumber } from '@ethersproject/bignumber';
import { getRailgunWallet } from '../../wallets/active-wallets';
import { getMockToken } from '../../../test/mocks.test';
import { RelayerChain } from '../../../models/chain-models';
import { initEngine } from '../../lepton/lepton-init';
import { ChainType } from '@railgun-community/engine/dist/models/engine-types';
import { RailgunWallet } from '@railgun-community/engine/dist/wallet/railgun-wallet';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = {
  type: ChainType.EVM,
  id: NetworkChainID.Ethereum,
};

type NumMapType<T> = {
  [index: number]: T;
};

const MOCK_TOKEN_AMOUNT = BigNumber.from('1200000000000000000');

const shieldedTokenBalanceCache: NumMapType<ShieldedCachedBalance[]> = {};

const mockUpdateCachedShieldedBalances = async (
  wallet: RailgunWallet,
  chain: RelayerChain,
): Promise<void> => {
  if (shieldedTokenBalanceCache[chain.id] === undefined) {
    shieldedTokenBalanceCache[chain.id] = [];
  }
  const balances = await wallet.balances(chain).catch(throwErr);
  const tokenAddresses = Object.keys(balances);
  tokenAddresses.forEach((railBalanceAddress) => {
    const parsedAddress =
      parseRailBalanceAddress(railBalanceAddress).toLowerCase();
    const tokenAmount: TokenAmount = {
      tokenAddress: parsedAddress,
      amount: BigNumber.from(balances[railBalanceAddress].balance.toString()),
    };
    shieldedTokenBalanceCache[chain.id].push({
      tokenAmount,
      updatedAt: Date.now(),
    });
  });
  const mockTokenAmount: TokenAmount = {
    tokenAddress: getMockToken().address,
    amount: MOCK_TOKEN_AMOUNT,
  };
  shieldedTokenBalanceCache[chain.id].push({
    tokenAmount: mockTokenAmount,
    updatedAt: Date.now(),
  });
};

export const mockGetPrivateTokenBalanceCache = (
  chainID: NetworkChainID,
): ShieldedCachedBalance[] => {
  return shieldedTokenBalanceCache[chainID];
};

describe('shielded-balance-cache', () => {
  before(async () => {
    initEngine();
    await setupSingleTestWallet();
    await setupSingleTestWallet();
  });

  it('Should find no private token balances', () => {
    expect(getPrivateTokenBalanceCache(MOCK_CHAIN)).to.deep.equal([]);
  });

  it('Should pull private token balance of live wallet', async () => {
    const wallet = getRailgunWallet();
    await mockUpdateCachedShieldedBalances(wallet, MOCK_CHAIN);
    const mockBalance =
      getPrivateTokenBalanceCache(MOCK_CHAIN)[0].tokenAmount.amount;
    expect(mockBalance.toBigInt()).to.equal(MOCK_TOKEN_AMOUNT.toBigInt());
  });
}).timeout(30000);
