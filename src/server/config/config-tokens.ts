import { NetworkTokensConfig } from '../../models/config-models';
import {
  TokenAddressArbitrumGoerli,
  TokenAddressGoerli,
  TokenAddressPolygonMumbai,
} from './config-token-addresses';
import {
  STABLES_ETH,
  STABLES_BSC,
  STABLES_POLY,
  BLUECHIP_ETH,
  REN_TOKENS_ETH,
  BLUECHIP_BSC,
  BLUECHIP_POLY,
  BLUECHIP_ARBITRUM,
  STABLES_ARBITRUM,
} from './config-token-sets';
import { NetworkChainID } from './config-chains';
import { ChainType } from '@railgun-community/engine';

/**
 *
 * The token defaults, like all other configs, can be appended safely
 * in MY-CONFIG, using the following syntax:
 *
 *  configTokens[ChainType.EVM][NetworkChainID.Ethereum]['0x_token_address'] = {
 *    symbol: 'TOKEN1',
 *  };
 *
 */

const tokensConfig: NetworkTokensConfig = {
  [ChainType.EVM]: {
    [NetworkChainID.Ethereum]: {
      ...STABLES_ETH,
      ...BLUECHIP_ETH,
      ...REN_TOKENS_ETH,
    },
    [NetworkChainID.EthereumGoerli]: {
      [TokenAddressGoerli.WETH]: {
        symbol: 'WETH',
      },
      [TokenAddressGoerli.DAI]: {
        symbol: 'DAI',
      },
    },
    [NetworkChainID.BNBChain]: {
      ...BLUECHIP_BSC,
      ...STABLES_BSC,
    },
    [NetworkChainID.PolygonPOS]: {
      ...STABLES_POLY,
      ...BLUECHIP_POLY,
    },
    [NetworkChainID.Arbitrum]: {
      ...STABLES_ARBITRUM,
      ...BLUECHIP_ARBITRUM,
    },
    [NetworkChainID.PolygonMumbai]: {
      [TokenAddressPolygonMumbai.WMATIC]: {
        symbol: 'WMATIC',
      },
      [TokenAddressPolygonMumbai.DERC20]: {
        symbol: 'DERC20',
      },
    },
    [NetworkChainID.ArbitrumGoerli]: {
      [TokenAddressArbitrumGoerli.WETH]: {
        symbol: 'WETH',
      },
      [TokenAddressArbitrumGoerli.USDC]: {
        symbol: 'USDC',
      },
    },
    [NetworkChainID.Hardhat]: {
      '0x5FbDB2315678afecb367f032d93F642f64180aa3': {
        symbol: 'TESTERC20',
      },
    },
  },
};

export default tokensConfig;
