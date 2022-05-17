import { NetworkTokensConfig } from '../../models/config-models';
import { NetworkChainID } from './config-chain-ids';

/**
 *
 * The token defaults, like all other configs, can be appended safely
 * in MY-CONFIG, using the following syntax:
 *
 *  configTokens[NetworkChainID.Ethereum]['0x_token_address'] = {
 *    symbol: 'TOKEN1',
 *  };
 *
 */

enum TokenAddressEth {
  USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7',
  WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  RAIL = '0xe76C6c83af64e4C60245D8C7dE953DF673a7A33D',
}
enum TokenAddressRopsten {
  WETH = '0xc778417e063141139fce010982780140aa0cd5ab',
  TESTERC20 = '0xAa753fb4e77ea8Adb16200865839ffB1d86BAE5E',
  RAILLEGACY = '0x784dbb737703225a6d5defffc7b395d59e348e3d',
}
enum TokenAddressBSC {
  WBNB = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  DAI = '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
  CAKE = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',

  // Unused until more liquidity and price stability:
  // RAILBSC = '0x3F847b01d4d498a293e3197B186356039eCd737F',
}
enum TokenAddressPoly {
  WMATIC = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  DAI = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
  BNB = '0xA649325Aa7C5093d12D6F98EB4378deAe68CE23F',
  WETH = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',

  // Unused until more liquidity and price stability:
  // RAILPOLY = '0x92A9C92C215092720C731c96D4Ff508c831a714f',
}

export default {
  [NetworkChainID.Ethereum]: {
    [TokenAddressEth.WETH]: {
      symbol: 'WETH',
    },
    [TokenAddressEth.USDT]: {
      symbol: 'USDT',
    },
    [TokenAddressEth.WBTC]: {
      symbol: 'WBTC',
    },
    [TokenAddressEth.DAI]: {
      symbol: 'DAI',
    },
    [TokenAddressEth.USDC]: {
      symbol: 'USDC',
    },
    [TokenAddressEth.RAIL]: {
      symbol: 'RAIL',
    },
  },
  [NetworkChainID.Ropsten]: {
    [TokenAddressRopsten.WETH]: {
      symbol: 'WETH',
    },
    [TokenAddressRopsten.TESTERC20]: {
      symbol: 'TESTERC20',
    },
    [TokenAddressRopsten.RAILLEGACY]: {
      symbol: 'RAILLEGACY',
    },
  },
  [NetworkChainID.BNBSmartChain]: {
    [TokenAddressBSC.WBNB]: {
      symbol: 'WBNB',
    },
    [TokenAddressBSC.BUSD]: {
      symbol: 'BUSD',
    },
    [TokenAddressBSC.DAI]: {
      symbol: 'DAI',
    },
    [TokenAddressBSC.CAKE]: {
      symbol: 'CAKE',
    },
  },
  [NetworkChainID.PolygonPOS]: {
    [TokenAddressPoly.WMATIC]: {
      symbol: 'WMATIC',
    },
    [TokenAddressPoly.DAI]: {
      symbol: 'DAI',
    },
    [TokenAddressPoly.BNB]: {
      symbol: 'BNB',
    },
    [TokenAddressPoly.WETH]: {
      symbol: 'WETH',
    },
  },
  [NetworkChainID.HardHat]: {
    '0x5FbDB2315678afecb367f032d93F642f64180aa3': {
      symbol: 'TESTERC20',
    },
  },
} as NetworkTokensConfig;
