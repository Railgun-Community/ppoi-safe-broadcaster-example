import { bytes } from '@railgun-community/lepton/dist/utils';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import { BigNumber } from 'ethers';
import { NetworkChainID } from '../../server/config/config-chain-ids';
import { logger } from '../../util/logger';

const parseRailBalanceAddress = (tokenAddress: string) => {
  return '0x' + bytes.trim(tokenAddress, 20);
};

export const onBalancesUpdate = async (wallet: RailgunWallet) => {
  // TODO: Use chainID from onBalancesUpdate event data (Needs Lepton update).
  const chainID = NetworkChainID.Ropsten;

  logger.log(`Wallet balance SCANNED. Getting balances for chain ${chainID}.`);

  const balances = await wallet.balances(chainID);

  const tokenAddresses = Object.keys(balances);
  const balancesFormatted = tokenAddresses.map((railBalanceAddress) => {
    return {
      tokenAddress: parseRailBalanceAddress(railBalanceAddress),
      balance: BigNumber.from(balances[railBalanceAddress].balance),
    };
  });

  // TODO: Handle updated balances: balancesFormatted.
};
