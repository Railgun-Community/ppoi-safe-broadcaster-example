import { AddressToTokenMap } from '../../models/config-models';
import {
  TokenAddressEthereum,
  TokenAddressBSC,
  TokenAddressPolygonPOS,
  TokenAddressArbitrum,
} from './config-token-addresses';

import { feeConfigL1, feeConfigL2 } from './config-fees';

export const STABLES_ETH: AddressToTokenMap = {
  [TokenAddressEthereum.USDT]: {
    symbol: 'USDT',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.DAI]: {
    symbol: 'DAI',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.USDC]: {
    symbol: 'USDC',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.FRAX]: {
    symbol: 'FRAX',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.FEI]: {
    symbol: 'FEI',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.RAI]: {
    symbol: 'RAI',
    fee: feeConfigL1(1.18),
  },
};

export const BLUECHIP_ETH: AddressToTokenMap = {
  [TokenAddressEthereum.WETH]: {
    symbol: 'WETH',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.WBTC]: {
    symbol: 'WBTC',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.RAIL]: {
    symbol: 'RAIL',
    fee: feeConfigL1(1.18),
  },
};

export const REN_TOKENS_ETH: AddressToTokenMap = {
  [TokenAddressEthereum.REN]: {
    symbol: 'REN',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.RENBTC]: {
    symbol: 'RENBTC',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.RENZEC]: {
    symbol: 'RENZEC',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.RENDOGE]: {
    symbol: 'RENDOGE',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressEthereum.RENFIL]: {
    symbol: 'RENFIL',
    fee: feeConfigL1(1.18),
  },
};

export const BLUECHIP_BSC: AddressToTokenMap = {
  [TokenAddressBSC.WBNB]: {
    symbol: 'WETH',
    fee: feeConfigL1(1.18),
  },

  [TokenAddressBSC.CAKE]: {
    symbol: 'CAKE',
    fee: feeConfigL1(1.18),
  },
};
export const BLUECHIP_POLY: AddressToTokenMap = {
  [TokenAddressPolygonPOS.WETH]: {
    symbol: 'WETH',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressPolygonPOS.BNB]: {
    symbol: 'WETH',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressPolygonPOS.WMATIC]: {
    symbol: 'WMATIC',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressPolygonPOS.WBTC]: {
    symbol: 'WBTC',
    fee: feeConfigL1(1.18),
  },
};
export const STABLES_BSC: AddressToTokenMap = {
  [TokenAddressBSC.BUSD]: {
    symbol: 'BUSD',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressBSC.DAI]: {
    symbol: 'DAI',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressBSC.USDC]: {
    symbol: 'USDC',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressBSC.USDT]: {
    symbol: 'USDT',
    fee: feeConfigL1(1.18),
  },
};
export const STABLES_POLY: AddressToTokenMap = {
  [TokenAddressPolygonPOS.DAI]: {
    symbol: 'DAI',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressPolygonPOS.USDC]: {
    symbol: 'USDC',
    fee: feeConfigL1(1.18),
  },
  [TokenAddressPolygonPOS.USDT]: {
    symbol: 'USDT',
    fee: feeConfigL1(1.18),
  },
};

export const STABLES_ARBITRUM: AddressToTokenMap = {
  [TokenAddressArbitrum.USDT]: {
    symbol: 'USDT',
    fee: feeConfigL2(1.8),
  },
  [TokenAddressArbitrum.USDC]: {
    symbol: 'USDC',
    fee: feeConfigL2(1.8),
  },
  [TokenAddressArbitrum.DAI]: {
    symbol: 'DAI',
    fee: feeConfigL2(1.8),
  },
  [TokenAddressArbitrum.TUSD]: {
    symbol: 'TUSD',
    fee: feeConfigL2(1.8),
  },
};

export const BLUECHIP_ARBITRUM: AddressToTokenMap = {
  [TokenAddressArbitrum.UNI]: {
    symbol: 'UNI',
    fee: feeConfigL2(1.8),
  },
  [TokenAddressArbitrum.FRAX]: {
    symbol: 'FRAX',
    fee: feeConfigL2(1.8),
  },
  [TokenAddressArbitrum.WBTC]: {
    symbol: 'WBTC',
    fee: feeConfigL2(1.8),
  },
  [TokenAddressArbitrum.WETH]: {
    symbol: 'WETH',
    fee: feeConfigL2(1.8),
  },
};
