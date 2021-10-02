/*
  A mock file for minimal-slp-wallet
*/

const BCHJS = require('@psf/bch-js')

class BchWallet {
  constructor () {
    this.walletInfoPromise = true

    this.walletInfo = {
      mnemonic:
        'rebel congress piece seat virtual tongue curious leader glass cute either moral',
      privateKey: 'L1fqtLVmksSdUZPcMgpUGMkBmMYGjJQe8dbqhkD8s16eBKCYTYpH',
      publicKey:
        '02acad5d4f1ad0c03e016639a98d8beebb3939e0e29529dcab916dab3b23c47e6f',
      cashAddress: 'bitcoincash:qp65erjld4jetgzwgvh6sxkyay97cl6gfyxue46uey',
      address: 'bitcoincash:qp65erjld4jetgzwgvh6sxkyay97cl6gfyxue46uey',
      slpAddress: 'simpleledger:qp65erjld4jetgzwgvh6sxkyay97cl6gfy28jw0u86',
      legacyAddress: '1BhDmfBRALFVZ4zryxDXNz8xJMxadyZD7k',
      hdPath: "m/44'/245'/0'/0/0",
      description: ''
    }

    this.bchjs = new BCHJS()

    // Environment variable is used by wallet-balance.unit.js to force an error.
    if (process.env.NO_UTXO) {
      this.utxos = {}
    } else {
      this.utxos = {
        utxoStore: {
          address: 'bitcoincash:qqetvdnlt0p8g27dr44cx7h057kpzly9xse9huc97z',
          bchUtxos: [
            {
              height: 700685,
              tx_hash:
                '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              tx_pos: 0,
              value: 1000,
              txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              vout: 0,
              isValid: false
            },
            {
              height: 700685,
              tx_hash:
                '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              tx_pos: 2,
              value: 19406,
              txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              vout: 2,
              isValid: false
            }
          ],
          nullUtxos: [],
          slpUtxos: {
            type1: {
              mintBatons: [],
              tokens: [
                {
                  height: 700522,
                  tx_hash:
                    'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
                  tx_pos: 1,
                  value: 546,
                  txid: 'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
                  vout: 1,
                  utxoType: 'token',
                  transactionType: 'send',
                  tokenId:
                    'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
                  tokenTicker: 'TROUT',
                  tokenName: "Trout's test token",
                  tokenDocumentUrl: 'troutsblog.com',
                  tokenDocumentHash: '',
                  decimals: 2,
                  tokenType: 1,
                  isValid: true,
                  tokenQty: '4.25'
                },
                {
                  height: 0,
                  tx_hash:
                    'c0ac066ce6efa1fa4763bf85a91c738e57c12b8765731bd07f0d8f5a55ce582f',
                  tx_pos: 1,
                  value: 546,
                  txid: 'c0ac066ce6efa1fa4763bf85a91c738e57c12b8765731bd07f0d8f5a55ce582f',
                  vout: 1,
                  utxoType: 'token',
                  transactionType: 'send',
                  tokenId:
                    '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
                  tokenTicker: 'PSF',
                  tokenName: 'Permissionless Software Foundation',
                  tokenDocumentUrl: 'psfoundation.cash',
                  tokenDocumentHash: '',
                  decimals: 8,
                  tokenType: 1,
                  isValid: true,
                  tokenQty: '1'
                }
              ]
            },
            nft: {
              groupMintBatons: [],
              groupTokens: [],
              tokens: []
            }
          }
        }
      }
    }
  }

  async getUtxos () {
    return {}
  }
}

module.exports = BchWallet
