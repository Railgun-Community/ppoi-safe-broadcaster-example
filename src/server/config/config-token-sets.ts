import { AddressToTokenMap } from '../../models/config-models';
import {
  TokenAddressEthereum,
  TokenAddressBSC,
  TokenAddressPolygonPOS,
  TokenAddressArbitrum,
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

export const REN_TOKENS_ETH: AddressToTokenMap = {
  [TokenAddressEthereum.RENBTC]: {
    symbol: 'RENBTC',
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

export const STABLES_ARBITRUM: AddressToTokenMap = {
  [TokenAddressArbitrum.USDT]: {
    symbol: 'USDT',
  },
  [TokenAddressArbitrum.USDC]: {
    symbol: 'USDC',
  },
  [TokenAddressArbitrum.DAI]: {
    symbol: 'DAI',
  },
  [TokenAddressArbitrum.TUSD]: {
    symbol: 'TUSD',
  },
};

export const BLUECHIP_ARBITRUM: AddressToTokenMap = {
  [TokenAddressArbitrum.UNI]: {
    symbol: 'UNI',
  },
  [TokenAddressArbitrum.FRAX]: {
    symbol: 'FRAX',
  },
  [TokenAddressArbitrum.WBTC]: {
    symbol: 'WBTC',
  },
  [TokenAddressArbitrum.WETH]: {
    symbol: 'WETH',
  },
};
