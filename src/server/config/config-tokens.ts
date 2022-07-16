import { NetworkTokensConfig } from '../../models/config-models';
import { TokenAddressRopsten } from './config-token-addresses';
import {
  STABLES_ETH,
  STABLES_BSC,
  STABLES_POLY,
  BLUECHIP_ETH,
  REN_TOKENS_ETH,
  BLUECHIP_BSC,
  BLUECHIP_POLY,
} from './config-token-sets';
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

export default {
  [NetworkChainID.Ethereum]: {
    ...STABLES_ETH,
    ...BLUECHIP_ETH,
    ...REN_TOKENS_ETH,
  },
  [NetworkChainID.PolygonPOS]: {
    ...STABLES_POLY,
    ...BLUECHIP_POLY,
  },
  [NetworkChainID.BNBSmartChain]: {
    ...BLUECHIP_BSC,
    ...STABLES_BSC,
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

  [NetworkChainID.HardHat]: {
    '0x5FbDB2315678afecb367f032d93F642f64180aa3': {
      symbol: 'TESTERC20',
    },
  },
} as NetworkTokensConfig;
