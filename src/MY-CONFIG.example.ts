/*
 * Configure your overrides for default settings and networks here.
 */

import configDefaults from './server/config/config-defaults';

export const myConfigOverrides = () => {
  // Use these indeces to configure HD wallets from the same mnemonic.
  // Each individual wallet needs gas funds, but they reuse the same RAILGUN wallet.
  configDefaults.wallet.hdWallets = [
    {
      index: 0,
      priority: 1,
    },
  ];

  //
  // Set other configs, for example:
  //
  // configDefaults.debug.logLevel = DebugLevel.None;
  //
  // configDefaults.networks.active = [
  //   NetworkChainID.Ropsten,
  //   NetworkChainID.BNBSmartChain,
  // ];
  //
  // configTokens[NetworkChainID.Ethereum] = {
  //   '0x_token_address': {
  //     symbol: 'TOKEN1',
  //   },
  // };
};
