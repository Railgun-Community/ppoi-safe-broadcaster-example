import { AddressToTokenMap } from '../../models/config-models';
import {
  TokenAddressEth,
  TokenAddressBSC,
  TokenAddressPoly,
} from './config-token-addresses';

export const STABLES_ETH: AddressToTokenMap = {
  [TokenAddressEth.USDT]: {
    symbol: 'USDT',
  },
  [TokenAddressEth.DAI]: {
    symbol: 'DAI',
  },
  [TokenAddressEth.USDC]: {
    symbol: 'USDC',
  },
  [TokenAddressEth.FRAX]: {
    symbol: 'FRAX',
  },
  [TokenAddressEth.FEI]: {
    symbol: 'FEI',
  },
  [TokenAddressEth.RAI]: {
    symbol: 'RAI',
  },
};

export const BLUECHIP_ETH: AddressToTokenMap = {
  [TokenAddressEth.WETH]: {
    symbol: 'WETH',
  },
  [TokenAddressEth.WBTC]: {
    symbol: 'WBTC',
  },
  [TokenAddressEth.RAIL]: {
    symbol: 'RAIL',
  },
};

export const BLUECHIP_BSC: AddressToTokenMap = {
  [TokenAddressBSC.WBNB]: {
    symbol: 'WETH',
  },

  [TokenAddressBSC.CAKE]: {
    symbol: 'CAKE',
  },
};
export const BLUECHIP_POLY: AddressToTokenMap = {
  [TokenAddressPoly.WETH]: {
    symbol: 'WETH',
  },
  [TokenAddressPoly.BNB]: {
    symbol: 'WETH',
  },
  [TokenAddressPoly.WMATIC]: {
    symbol: 'WMATIC',
  },
  [TokenAddressPoly.WBTC]: {
    symbol: 'WBTC',
  },
};
export const STABLES_BSC: AddressToTokenMap = {
  [TokenAddressBSC.BUSD]: {
    symbol: 'BUSD',
  },
  [TokenAddressBSC.DAI]: {
    symbol: 'DAI',
  },
  [TokenAddressBSC.USDC]: {
    symbol: 'USDC',
  },
  [TokenAddressBSC.USDT]: {
    symbol: 'USDT',
  },
};
export const STABLES_POLY: AddressToTokenMap = {
  [TokenAddressPoly.DAI]: {
    symbol: 'DAI',
  },
  [TokenAddressPoly.USDC]: {
    symbol: 'USDC',
  },
  [TokenAddressPoly.USDT]: {
    symbol: 'USDT',
  },
};

export const REN_TOKENS_ETH: AddressToTokenMap = {
  [TokenAddressEth.REN]: {
    symbol: 'REN',
  },
  [TokenAddressEth.RENBTC]: {
    symbol: 'RENBTC',
  },
  [TokenAddressEth.RENZEC]: {
    symbol: 'RENZEC',
  },
  [TokenAddressEth.RENDOGE]: {
    symbol: 'RENDOGE',
  },
  [TokenAddressEth.RENFIL]: {
    symbol: 'RENFIL',
  },
};
