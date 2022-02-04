import { BigNumber } from '@ethersproject/bignumber';
import { babyjubjub } from '@railgun-community/lepton/dist/utils';
import { decode } from '@railgun-community/lepton/dist/keyderivation/bech32-encode';
import { ERC20Note } from '@railgun-community/lepton';
import { BytesData } from '@railgun-community/lepton/dist/utils/bytes';
import { TokenAmount } from '../../models/token-models';

export const erc20NotesFromTokenAmounts = (
  tokenAmounts: TokenAmount[],
  railAddress: string,
): ERC20Note[] => {
  const pubkey = decode(railAddress).pubkey;
  return tokenAmounts.map((tokenAmount) => {
    const random: BytesData = babyjubjub.random();
    const amount: BytesData = tokenAmount.amount
      .toHexString()
      .replace('0x', '');
    const token: BytesData = tokenAmount.tokenAddress.replace('0x', '');
    return new ERC20Note(pubkey, random, amount, token);
  });
};
