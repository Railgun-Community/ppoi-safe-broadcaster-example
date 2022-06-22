import {AddressToTokenMap} from '../../models/config-models';
import { TokenAddressEth, TokenAddressBSC, TokenAddressPoly, TokenAddressRopsten } from './config-tokens';

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

export const STABLES_BSC: AddressToTokenMap ={
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
export const STABLES_POLYGON: AddressToTokenMap = {
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
        symbol: 'REN'
    },
    [TokenAddressEth.RENBTC]: {
        symbol: 'RENBTC'
    },
    [TokenAddressEth.RENZEC]: {
        symbol: 'RENZEC'
    },
    [TokenAddressEth.RENDOGE]: {
        symbol: 'RENDOGE'
    },
    [TokenAddressEth.RENFIL]: {
        symbol: 'RENFIL'
    },

}


