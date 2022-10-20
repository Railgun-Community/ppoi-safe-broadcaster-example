import { AddressToTokenMap } from '../../models/config-models';
import {
  TokenAddressEthereum,
  TokenAddressBSC,
  TokenAddressPolygonPOS,
} from './config-token-addresses';

export const STABLES_ETH: AddressToTokenMap = {
  [TokenAddressEthereum.USDT]: {
    symbol: 'USDT',
  },
  [TokenAddressEthereum.DAI]: {
    symbol: 'DAI',
  },
  [TokenAddressEthereum.USDC]: {
    symbol: 'USDC',
  },
  [TokenAddressEthereum.FRAX]: {
    symbol: 'FRAX',
  },
  [TokenAddressEthereum.FEI]: {
    symbol: 'FEI',
  },
  [TokenAddressEthereum.RAI]: {
    symbol: 'RAI',
  },
};

export const BLUECHIP_ETH: AddressToTokenMap = {
  [TokenAddressEthereum.WETH]: {
    symbol: 'WETH',
  },
  [TokenAddressEthereum.WBTC]: {
    symbol: 'WBTC',
  },
  [TokenAddressEthereum.RAIL]: {
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
  [TokenAddressPolygonPOS.WETH]: {
    symbol: 'WETH',
  },
  [TokenAddressPolygonPOS.BNB]: {
    symbol: 'WETH',
  },
  [TokenAddressPolygonPOS.WMATIC]: {
    symbol: 'WMATIC',
  },
  [TokenAddressPolygonPOS.WBTC]: {
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
  [TokenAddressPolygonPOS.DAI]: {
    symbol: 'DAI',
  },
  [TokenAddressPolygonPOS.USDC]: {
    symbol: 'USDC',
  },
  [TokenAddressPolygonPOS.USDT]: {
    symbol: 'USDT',
  },
};

export const REN_TOKENS_ETH: AddressToTokenMap = {
  [TokenAddressEthereum.REN]: {
    symbol: 'REN',
  },
  [TokenAddressEthereum.RENBTC]: {
    symbol: 'RENBTC',
  },
  [TokenAddressEthereum.RENZEC]: {
    symbol: 'RENZEC',
  },
  [TokenAddressEthereum.RENDOGE]: {
    symbol: 'RENDOGE',
  },
  [TokenAddressEthereum.RENFIL]: {
    symbol: 'RENFIL',
  },
};
